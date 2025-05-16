"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface GalleryImage {
  src: string;
  alt: string;
  title: string;
  description: string;
}

interface PhotoGalleryProps {
  images: GalleryImage[];
}

export default function PhotoGallery({ images }: PhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Auto-rotate images
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Main featured image */}
      <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden mb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="absolute inset-0"
          >
            <Image
              src={images[activeIndex].src || "/placeholder.svg"}
              alt={images[activeIndex].alt}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-white text-xl font-bold mb-2"
              >
                {images[activeIndex].title}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-white/80 text-sm"
              >
                {images[activeIndex].description}
              </motion.p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Thumbnail grid */}
      <div className="grid grid-cols-4 gap-2">
        {images.map((image, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`relative aspect-square rounded-md overflow-hidden cursor-pointer transition-all duration-300 ${
              activeIndex === index
                ? "ring-2 ring-pink-500 ring-offset-2 dark:ring-offset-gray-800"
                : ""
            }`}
            onClick={() => setActiveIndex(index)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            whileHover={{ scale: 1.05 }}
          >
            <Image
              src={image.src || "/placeholder.svg"}
              alt={image.alt}
              fill
              className="object-cover"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity:
                  hoveredIndex === index || activeIndex === index ? 1 : 0,
              }}
              className="absolute inset-0 bg-black/40 flex items-center justify-center"
            >
              {activeIndex === index && (
                <div className="w-2 h-2 bg-pink-500 rounded-full" />
              )}
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
