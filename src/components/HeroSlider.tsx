"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Banner = {
  id: string;
  image: string;
  title?: string;
  subtitle?: string;
};

export default function HeroSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/banners")
      .then((r) => r.json())
      .then((data) => {
        setBanners(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prev = () => {
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
  };

  // Auto-play every 4 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [banners.length, next]);

  // Fallback hero when no banners
  if (loading) {
    return (
      <section className="bg-gradient-to-br from-blue-700 to-blue-500 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-4">💊</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Upendo Pharmacy</h1>
          <p className="text-xl text-blue-100 mb-8">Dawa bora, huduma ya kwanza</p>
          <Link href="/medicines" className="bg-white text-blue-700 px-8 py-3 rounded-full text-lg font-semibold hover:bg-blue-50 transition shadow inline-block">
            Angalia Dawa
          </Link>
        </div>
      </section>
    );
  }

  if (banners.length === 0) {
    return (
      <section className="bg-gradient-to-br from-blue-700 to-blue-500 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-4">💊</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Upendo Pharmacy</h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8">
            Dawa bora, huduma ya kwanza — Tunajali afya yako!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/medicines" className="bg-white text-blue-700 px-8 py-3 rounded-full text-lg font-semibold hover:bg-blue-50 transition shadow">
              Angalia Dawa
            </Link>
            <Link href="/register" className="border-2 border-white text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-blue-600 transition">
              Jisajili Bure
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full overflow-hidden bg-blue-900" style={{ height: "480px" }}>
      {/* Slides */}
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === current ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <Image
            src={banner.image}
            alt={banner.title || "Upendo Pharmacy"}
            fill
            className="object-cover"
            priority={index === 0}
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Text overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-6 z-10">
            {banner.title && (
              <h2 className="text-3xl md:text-5xl font-bold mb-3 drop-shadow-lg">
                {banner.title}
              </h2>
            )}
            {banner.subtitle && (
              <p className="text-lg md:text-2xl text-blue-100 mb-6 drop-shadow max-w-2xl">
                {banner.subtitle}
              </p>
            )}
            <Link
              href="/medicines"
              className="bg-white text-blue-700 px-8 py-3 rounded-full text-lg font-semibold hover:bg-blue-50 transition shadow"
            >
              Angalia Dawa
            </Link>
          </div>
        </div>
      ))}

      {/* Navigation arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition backdrop-blur-sm"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition backdrop-blur-sm"
          >
            <ChevronRight size={28} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === current ? "bg-white w-6 h-3" : "bg-white/50 w-3 h-3"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
