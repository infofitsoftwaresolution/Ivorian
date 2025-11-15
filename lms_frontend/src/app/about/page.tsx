import { 
  AcademicCapIcon, 
  UserGroupIcon, 
  RocketLaunchIcon, 
  SparklesIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import HomeHeader from '@/components/layout/HomeHeader';
import HomeFooter from '@/components/layout/HomeFooter';

const values = [
  {
    name: 'Innovation',
    description: 'We continuously innovate to provide cutting-edge learning experiences powered by AI and modern technology.',
    icon: LightBulbIcon,
    color: 'from-yellow-500 to-orange-500'
  },
  {
    name: 'Excellence',
    description: 'We strive for excellence in everything we do, from course content to user experience.',
    icon: SparklesIcon,
    color: 'from-blue-500 to-purple-500'
  },
  {
    name: 'Accessibility',
    description: 'Education should be accessible to everyone, regardless of their background or location.',
    icon: GlobeAltIcon,
    color: 'from-green-500 to-emerald-500'
  },
  {
    name: 'Integrity',
    description: 'We maintain the highest standards of integrity and transparency in all our operations.',
    icon: ShieldCheckIcon,
    color: 'from-indigo-500 to-blue-500'
  }
];

const team = [
  {
    name: 'Dr. Sarah Johnson',
    role: 'CEO & Co-Founder',
    bio: 'Former Senior Software Engineer at Google with 15+ years of experience in EdTech.',
    avatar: '/avatars/sarah.jpg',
    expertise: ['EdTech', 'Product Strategy', 'Leadership']
  },
  {
    name: 'Prof. Michael Chen',
    role: 'CTO & Co-Founder',
    bio: 'AI Research Lead at Stanford, specializing in machine learning and educational technology.',
    avatar: '/avatars/michael.jpg',
    expertise: ['AI/ML', 'Research', 'Technology']
  },
  {
    name: 'Emma Rodriguez',
    role: 'Head of Learning',
    bio: 'Digital Marketing Director with expertise in curriculum development and instructional design.',
    avatar: '/avatars/emma.jpg',
    expertise: ['Curriculum Design', 'Instructional Design', 'Education']
  },
  {
    name: 'Alex Thompson',
    role: 'Head of Design',
    bio: 'Senior UX Designer at Apple, passionate about creating intuitive and beautiful learning experiences.',
    avatar: '/avatars/alex.jpg',
    expertise: ['UX/UI Design', 'User Research', 'Product Design']
  }
];

const stats = [
  { label: 'Active Students', value: '50K+', icon: UserGroupIcon },
  { label: 'Expert Instructors', value: '200+', icon: AcademicCapIcon },
  { label: 'Courses Available', value: '1000+', icon: RocketLaunchIcon },
  { label: 'Success Rate', value: '95%', icon: SparklesIcon }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <HomeHeader />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            About InfoFit Labs
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90">
            Empowering learners worldwide with AI-integrated education and expert-led courses
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-gradient-to-br from-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-4 leading-relaxed">
                At InfoFit Labs, we believe that education should be accessible, engaging, and transformative. 
                Our mission is to democratize high-quality education by combining cutting-edge AI technology 
                with expert instruction to create personalized learning experiences for everyone.
              </p>
              <p className="text-lg text-gray-600 mb-4 leading-relaxed">
                We&apos;re committed to breaking down barriers to education and empowering learners to achieve 
                their goals, whether they&apos;re advancing their careers, exploring new interests, or pursuing 
                lifelong learning.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Through our innovative platform, we connect passionate learners with world-class instructors 
                and provide the tools, resources, and support needed to succeed in today&apos;s rapidly evolving world.
              </p>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-2xl flex items-center justify-center shadow-2xl">
                <RocketLaunchIcon className="w-32 h-32 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className={`w-16 h-16 bg-gradient-to-r ${index === 0 ? 'from-blue-500 to-purple-600' : index === 1 ? 'from-purple-500 to-pink-600' : index === 2 ? 'from-green-500 to-blue-600' : 'from-yellow-500 to-orange-600'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600 text-sm md:text-base font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-gradient-to-br from-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className={`w-20 h-20 bg-gradient-to-r ${value.color} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                  <value.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.name}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-gradient-to-br from-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Passionate educators and technologists dedicated to transforming learning
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserGroupIcon className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-blue-600 font-semibold mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">{member.bio}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {member.expertise.map((skill, skillIndex) => (
                    <span 
                      key={skillIndex}
                      className="px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Story
            </h2>
          </div>
          
          <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
            <p>
              InfoFit Labs was founded in 2023 with a simple yet powerful vision: to make world-class 
              education accessible to everyone, everywhere. Our founders, experienced educators and 
              technologists, recognized that traditional learning platforms were falling short in 
              providing personalized, engaging, and effective learning experiences.
            </p>
            <p>
              We set out to build a platform that combines the best of human expertise with the power 
              of artificial intelligence. By leveraging AI to personalize learning paths, recommend 
              content, and provide intelligent feedback, we&apos;ve created a learning ecosystem that 
              adapts to each student&apos;s unique needs and learning style.
            </p>
            <p>
              Today, InfoFit Labs serves tens of thousands of learners across the globe, offering 
              courses in programming, data science, design, marketing, and more. Our community of 
              expert instructors brings real-world experience and industry insights to every course, 
              ensuring that students gain practical, applicable skills.
            </p>
            <p>
              As we continue to grow, our commitment remains the same: to empower learners, support 
              instructors, and transform education for the better. We&apos;re just getting started, and 
              we&apos;re excited to have you join us on this journey.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of learners who are transforming their careers with InfoFit Labs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register" 
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              Get Started Free
            </Link>
            <Link 
              href="/courses" 
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <HomeFooter />
    </div>
  );
}

