'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  RocketLaunchIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

// Hero carousel data
const heroSlides = [
  {
    id: 1,
    title: "Learn from the world's best instructors",
    subtitle: "Transform your career with AI-powered learning. Choose from thousands of courses taught by industry experts.",
    image: "/hero/slide1.png",
    cta: "Explore Courses",
    ctaLink: "/courses"
  },
  {
    id: 2,
    title: "Master in-demand skills",
    subtitle: "From programming to design, business to data science. Learn the skills that matter in today's job market.",
    image: "/hero/slide2.png",
    cta: "Browse Categories",
    ctaLink: "/categories"
  },
  {
    id: 3,
    title: "Join live tutorial sessions",
    subtitle: "Connect with instructors in real-time. Ask questions, get feedback, and learn interactively.",
    image: "/hero/slide3.png",
    cta: "View Sessions",
    ctaLink: "/sessions"
  },
  {
    id: 4,
    title: "Earn certificates and advance your career",
    subtitle: "Complete courses and earn certificates that are recognized by top companies worldwide.",
    image: "/hero/slide4.png",
    cta: "Get Started",
    ctaLink: "/register"
  }
];

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-advance carousel (only after mounting)
  useEffect(() => {
    if (!mounted) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [mounted]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <section className="relative h-[600px] overflow-hidden">
        <div className="relative h-full">
          <div className="absolute inset-0 transition-opacity duration-1000 opacity-100">
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${heroSlides[0].image})`,
              }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            </div>
            
            {/* Content */}
            <div className="relative h-full flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-3xl text-white">
                  <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                    {heroSlides[0].title}
                  </h1>
                  <p className="text-xl md:text-2xl mb-8 opacity-90 leading-relaxed">
                    {heroSlides[0].subtitle}
                  </p>
                  <Link 
                    href={heroSlides[0].ctaLink}
                    className="btn bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-full inline-flex items-center"
                  >
                    {heroSlides[0].cta}
                    <RocketLaunchIcon className="w-5 h-5 ml-2" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-[600px] overflow-hidden">
      {/* Carousel Slides */}
      <div className="relative h-full">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${slide.image})`,
              }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            </div>
            
            {/* Content */}
            <div className="relative h-full flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-3xl text-white">
                  <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                    {slide.title}
                  </h1>
                  <p className="text-xl md:text-2xl mb-8 opacity-90 leading-relaxed">
                    {slide.subtitle}
                  </p>
                  <Link 
                    href={slide.ctaLink}
                    className="btn bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-full inline-flex items-center"
                  >
                    {slide.cta}
                    <RocketLaunchIcon className="w-5 h-5 ml-2" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm"
      >
        <ChevronLeftIcon className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm"
      >
        <ChevronRightIcon className="w-6 h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-white scale-125' 
                : 'bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
