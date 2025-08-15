import React, { memo } from 'react';
import Image from 'next/image';
import { useStableTranslation } from '../../../hooks/useStableTranslation';

const TestimonialSection: React.FC = memo(() => {
  const { t } = useStableTranslation('home');

  const testimonials = [
    {
      quote: t('testimonials.testimonial1.quote'),
      author: t('testimonials.testimonial1.author'),
      role: t('testimonials.testimonial1.role'),
      imageSrc: "/optimized-avatars/mike-johnson.svg"
    },
    {
      quote: t('testimonials.testimonial2.quote'),
      author: t('testimonials.testimonial2.author'),
      role: t('testimonials.testimonial2.role'),
      imageSrc: "/optimized-avatars/sarah-williams.svg"
    },
    {
      quote: t('testimonials.testimonial3.quote'),
      author: t('testimonials.testimonial3.author'),
      role: t('testimonials.testimonial3.role'),
      imageSrc: "/optimized-avatars/dave-rodriguez.svg"
    }
  ];

  return (
    <section id="testimonials" className="bg-black py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white">{t('testimonials.title')}</h2>
          <div className="w-20 h-1 bg-[#9b9b6f] mx-auto mt-4 mb-6"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={`testimonial-${index}-${testimonial.author.replace(/\s+/g, '-').toLowerCase()}`} className="bg-gray-900 rounded-lg overflow-hidden shadow-lg">
              <div className="p-6">
                <svg className="h-8 w-8 text-[#9b9b6f] mb-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="text-gray-300 mb-6 italic">{testimonial.quote}</p>
                <div className="flex items-center">
                  <Image 
                    src={testimonial.imageSrc} 
                    alt={testimonial.author}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full mr-4 object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div>
                    <p className="text-white font-medium">{testimonial.author}</p>
                    <p className="text-gray-500 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
TestimonialSection.displayName = 'TestimonialSection';

export default TestimonialSection;