"""
Script to delete all users except specified ones
Usage: python scripts/delete_users.py
"""
import asyncio
import sys
import os
from pathlib import Path

# Fix Windows event loop issue
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# Add parent directory to path
script_dir = Path(__file__).parent
backend_dir = script_dir.parent
sys.path.insert(0, str(backend_dir))
os.chdir(backend_dir)

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.user import User
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Users to preserve
PRESERVE_EMAILS = [
    "admin@infofitlabs.com",
    "edumentrystd@gmail.com",
    "edumentryTutor@gmail.com",
    "edumentryInfofit@gmail.com"
]


async def delete_users_except_preserved():
    """
    Delete all users except the ones in PRESERVE_EMAILS list
    """
    async with AsyncSessionLocal() as db:
        try:
            # First, get all users to preserve
            preserve_query = select(User).where(User.email.in_(PRESERVE_EMAILS))
            result = await db.execute(preserve_query)
            preserved_users = result.scalars().all()
            
            preserved_emails_found = [user.email for user in preserved_users]
            preserved_ids = [user.id for user in preserved_users]
            
            logger.info(f"Found {len(preserved_users)} users to preserve:")
            for email in preserved_emails_found:
                logger.info(f"  - {email}")
            
            # Check if all preserve emails were found
            missing_emails = set(PRESERVE_EMAILS) - set(preserved_emails_found)
            if missing_emails:
                logger.warning(f"Warning: The following emails were not found in database: {missing_emails}")
            
            # Get all users to delete
            delete_query = select(User).where(~User.email.in_(PRESERVE_EMAILS))
            result = await db.execute(delete_query)
            users_to_delete = result.scalars().all()
            
            if not users_to_delete:
                logger.info("No users to delete. All users are in the preserve list.")
                return
            
            logger.info(f"Found {len(users_to_delete)} users to delete:")
            for user in users_to_delete:
                logger.info(f"  - {user.email} (ID: {user.id}, Role: {user.role})")
            
            # Confirm deletion
            print(f"\n⚠️  WARNING: This will delete {len(users_to_delete)} users!")
            print(f"Users to preserve: {len(preserved_users)}")
            print(f"\nUsers to be deleted:")
            for user in users_to_delete[:10]:  # Show first 10
                print(f"  - {user.email} (ID: {user.id})")
            if len(users_to_delete) > 10:
                print(f"  ... and {len(users_to_delete) - 10} more")
            
            response = input("\nType 'DELETE' to confirm: ")
            if response != "DELETE":
                logger.info("Deletion cancelled by user.")
                return
            
            # Delete users using bulk delete
            # First, get all user IDs to delete
            user_ids_to_delete = [user.id for user in users_to_delete]
            
            # Use bulk delete with cascade handling
            try:
                # Delete users (this will fail if there are foreign key constraints)
                # We'll handle related records if needed
                delete_stmt = delete(User).where(User.id.in_(user_ids_to_delete))
                result = await db.execute(delete_stmt)
                deleted_count = result.rowcount
                
                # Commit the transaction
                await db.commit()
                logger.info(f"✅ Successfully deleted {deleted_count} users.")
                logger.info(f"✅ Preserved {len(preserved_users)} users.")
                
            except Exception as e:
                # If bulk delete fails due to foreign key constraints, try individual deletes
                logger.warning(f"Bulk delete failed, trying individual deletes: {str(e)}")
                await db.rollback()
                
                deleted_count = 0
                failed_deletions = []
                
                for user in users_to_delete:
                    try:
                        # Try to delete the user
                        await db.delete(user)
                        await db.flush()  # Flush to check for immediate errors
                        deleted_count += 1
                        logger.info(f"Deleted user: {user.email} (ID: {user.id})")
                    except Exception as delete_error:
                        failed_deletions.append({
                            'email': user.email,
                            'id': user.id,
                            'error': str(delete_error)
                        })
                        logger.warning(f"Could not delete user {user.email} (ID: {user.id}): {str(delete_error)}")
                        await db.rollback()
                        # Continue with next user
                        continue
                
                # Commit successful deletions
                await db.commit()
                
                logger.info(f"✅ Successfully deleted {deleted_count} users.")
                if failed_deletions:
                    logger.warning(f"⚠️  Failed to delete {len(failed_deletions)} users due to foreign key constraints:")
                    for failed in failed_deletions:
                        logger.warning(f"  - {failed['email']} (ID: {failed['id']}): {failed['error']}")
                    logger.warning("You may need to delete related records (enrollments, submissions, etc.) first.")
                logger.info(f"✅ Preserved {len(preserved_users)} users.")
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Error during user deletion: {str(e)}")
            raise


if __name__ == "__main__":
    print("=" * 60)
    print("User Deletion Script")
    print("=" * 60)
    print(f"Users to preserve: {', '.join(PRESERVE_EMAILS)}")
    print("=" * 60)
    
    asyncio.run(delete_users_except_preserved())

