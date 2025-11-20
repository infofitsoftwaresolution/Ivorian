"""
Script to delete all organizations except the one with contact_email = 'edumentry@gmail.com'
Usage: python scripts/delete_organizations.py
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

from sqlalchemy import select, delete, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.organization import Organization
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Organization to preserve
PRESERVE_EMAIL = "edumentry@gmail.com"


async def delete_organizations_except_preserved():
    """
    Delete all organizations except the one with contact_email = PRESERVE_EMAIL
    """
    async with AsyncSessionLocal() as db:
        try:
            # First, find the organization to preserve
            preserve_query = select(Organization).where(Organization.contact_email == PRESERVE_EMAIL)
            result = await db.execute(preserve_query)
            preserved_org = result.scalar_one_or_none()
            
            if not preserved_org:
                logger.warning(f"⚠️  Organization with contact_email '{PRESERVE_EMAIL}' not found!")
                logger.warning("Please verify the email address. All organizations will be deleted if you proceed.")
                response = input(f"\nOrganization with email '{PRESERVE_EMAIL}' not found. Continue anyway? (yes/no): ")
                if response.lower() != "yes":
                    logger.info("Deletion cancelled by user.")
                    return
                preserved_org_id = None
            else:
                preserved_org_id = preserved_org.id
                logger.info(f"Found organization to preserve:")
                logger.info(f"  - ID: {preserved_org.id}")
                logger.info(f"  - Name: {preserved_org.name}")
                logger.info(f"  - Contact Email: {preserved_org.contact_email}")
            
            # Get all organizations to delete
            if preserved_org_id:
                delete_query = select(Organization).where(Organization.id != preserved_org_id)
            else:
                delete_query = select(Organization)
            
            result = await db.execute(delete_query)
            orgs_to_delete = result.scalars().all()
            
            if not orgs_to_delete:
                logger.info("No organizations to delete. All organizations are preserved.")
                return
            
            logger.info(f"Found {len(orgs_to_delete)} organizations to delete:")
            for org in orgs_to_delete:
                logger.info(f"  - {org.name} (ID: {org.id}, Email: {org.contact_email})")
            
            # Confirm deletion
            print(f"\n⚠️  WARNING: This will delete {len(orgs_to_delete)} organizations!")
            if preserved_org:
                print(f"Organization to preserve: {preserved_org.name} (ID: {preserved_org.id})")
            print(f"\nOrganizations to be deleted:")
            for org in orgs_to_delete[:10]:  # Show first 10
                print(f"  - {org.name} (ID: {org.id}, Email: {org.contact_email})")
            if len(orgs_to_delete) > 10:
                print(f"  ... and {len(orgs_to_delete) - 10} more")
            
            response = input("\nType 'DELETE' to confirm: ")
            if response != "DELETE":
                logger.info("Deletion cancelled by user.")
                return
            
            # Get all organization IDs to delete
            org_ids_to_delete = [org.id for org in orgs_to_delete]
            
            logger.info("Deleting related records first...")
            
            # Delete related records in the correct order to avoid foreign key constraints
            try:
                # 1. Set organization_id to NULL for users in organizations to be deleted
                logger.info("Setting organization_id to NULL for users...")
                await db.execute(
                    text("UPDATE users SET organization_id = NULL WHERE organization_id = ANY(:org_ids)"),
                    {"org_ids": org_ids_to_delete}
                )
                await db.flush()
                
                # 2. Delete courses in organizations to be deleted
                # First, we need to delete related records for courses
                logger.info("Deleting course-related records...")
                
                # Get course IDs for these organizations
                course_result = await db.execute(
                    text("SELECT id FROM courses WHERE organization_id = ANY(:org_ids)"),
                    {"org_ids": org_ids_to_delete}
                )
                course_ids = [row[0] for row in course_result.fetchall()]
                
                if course_ids:
                    # Delete lesson progress (via enrollments)
                    enrollment_result = await db.execute(
                        text("SELECT id FROM enrollments WHERE course_id = ANY(:course_ids)"),
                        {"course_ids": course_ids}
                    )
                    enrollment_ids = [row[0] for row in enrollment_result.fetchall()]
                    
                    if enrollment_ids:
                        await db.execute(
                            text("DELETE FROM lesson_progress WHERE enrollment_id = ANY(:enrollment_ids)"),
                            {"enrollment_ids": enrollment_ids}
                        )
                        await db.flush()
                    
                    # Delete enrollments
                    await db.execute(
                        text("DELETE FROM enrollments WHERE course_id = ANY(:course_ids)"),
                        {"course_ids": course_ids}
                    )
                    await db.flush()
                    
                    # Delete quiz submissions (via courses/lessons)
                    await db.execute(
                        text("DELETE FROM quiz_submissions WHERE quiz_id IN (SELECT id FROM quizzes WHERE lesson_id IN (SELECT id FROM lessons WHERE topic_id IN (SELECT id FROM topics WHERE course_id = ANY(:course_ids))))"),
                        {"course_ids": course_ids}
                    )
                    await db.flush()
                    
                    # Delete assignment submissions
                    await db.execute(
                        text("DELETE FROM assignment_submissions WHERE assignment_id IN (SELECT id FROM assignments WHERE course_id = ANY(:course_ids))"),
                        {"course_ids": course_ids}
                    )
                    await db.flush()
                    
                    # Delete quizzes
                    await db.execute(
                        text("DELETE FROM quizzes WHERE lesson_id IN (SELECT id FROM lessons WHERE topic_id IN (SELECT id FROM topics WHERE course_id = ANY(:course_ids)))"),
                        {"course_ids": course_ids}
                    )
                    await db.flush()
                    
                    # Delete assignments
                    await db.execute(
                        text("DELETE FROM assignments WHERE course_id = ANY(:course_ids)"),
                        {"course_ids": course_ids}
                    )
                    await db.flush()
                    
                    # Delete lesson attachments
                    await db.execute(
                        text("DELETE FROM lesson_attachments WHERE lesson_id IN (SELECT id FROM lessons WHERE topic_id IN (SELECT id FROM topics WHERE course_id = ANY(:course_ids)))"),
                        {"course_ids": course_ids}
                    )
                    await db.flush()
                    
                    # Delete lessons
                    await db.execute(
                        text("DELETE FROM lessons WHERE topic_id IN (SELECT id FROM topics WHERE course_id = ANY(:course_ids))"),
                        {"course_ids": course_ids}
                    )
                    await db.flush()
                    
                    # Delete topics
                    await db.execute(
                        text("DELETE FROM topics WHERE course_id = ANY(:course_ids)"),
                        {"course_ids": course_ids}
                    )
                    await db.flush()
                
                # 3. Delete courses
                logger.info("Deleting courses...")
                await db.execute(
                    text("DELETE FROM courses WHERE organization_id = ANY(:org_ids)"),
                    {"org_ids": org_ids_to_delete}
                )
                await db.flush()
                
                # 4. Delete organizations
                logger.info("Deleting organizations...")
                delete_stmt = delete(Organization).where(Organization.id.in_(org_ids_to_delete))
                result = await db.execute(delete_stmt)
                deleted_count = result.rowcount
                
                # Commit the transaction
                await db.commit()
                logger.info(f"✅ Successfully deleted {deleted_count} organizations and all related records.")
                if preserved_org:
                    logger.info(f"✅ Preserved organization: {preserved_org.name} (ID: {preserved_org.id})")
                
            except Exception as e:
                await db.rollback()
                logger.error(f"Error during deletion: {str(e)}")
                logger.error("Transaction rolled back. No organizations were deleted.")
                raise
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Error during organization deletion: {str(e)}")
            raise


if __name__ == "__main__":
    print("=" * 60)
    print("Organization Deletion Script")
    print("=" * 60)
    print(f"Organization to preserve: contact_email = '{PRESERVE_EMAIL}'")
    print("=" * 60)
    
    asyncio.run(delete_organizations_except_preserved())

