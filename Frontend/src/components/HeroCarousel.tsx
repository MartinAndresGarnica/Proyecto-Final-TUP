import React, { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { Autoplay, Pagination, Navigation, Controller } from "swiper/modules";
import { motion } from "framer-motion";
import { Button } from "react-bootstrap";
import { PlayCircle, Info } from "lucide-react";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import styles from "./HeroCarousel.module.css";

export interface IHeroCarouselItem {
  id: string;
  title: string;
  subtitle: string;
  backgroundImage: string;
  trailerLink: string;
  infoLink: string;
}

interface HeroCarouselProps {
  items: IHeroCarouselItem[];
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ items }) => {
  // Estados para sincronizar los tres Swipers
  const [firstSwiper, setFirstSwiper] = useState<SwiperType | null>(null);
  const [secondSwiper, setSecondSwiper] = useState<SwiperType | null>(null);
  const [thirdSwiper, setThirdSwiper] = useState<SwiperType | null>(null);

  if (!items || items.length === 0) {
    return (
      <div className={styles.emptyCarousel}>
        Próximamente grandes estrenos...
      </div>
    );
  }

  // Si hay menos de 3 ítems, el efecto triple no funciona bien, degradamos elegantemente a 1
  const isTriple = items.length >= 3;

  // Funciones para calcular el ítem anterior y siguiente en el array
  const getPrevItem = (idx: number) =>
    items[idx === 0 ? items.length - 1 : idx - 1];
  const getNextItem = (idx: number) =>
    items[idx === items.length - 1 ? 0 : idx + 1];

  return (
    <div className={styles.tripleSliderWrapper}>
      {/* CARRUSEL IZQUIERDO (Película Anterior) */}
      {isTriple && (
        <Swiper
          onSwiper={setFirstSwiper}
          modules={[Controller]}
          loop={true}
          allowTouchMove={false} // Solo se controla desde el principal
          speed={1000}
          className={styles.sideSwiper}
        >
          {items.map((_, idx) => {
            const item = getPrevItem(idx);
            return (
              <SwiperSlide
                key={`left-${item.id}`}
                className={styles.swiperSlide}
              >
                <div
                  className={styles.sideSlideBackground}
                  style={{ backgroundImage: `url(${item.backgroundImage})` }}
                ></div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      )}

      {/* CARRUSEL CENTRAL (El Principal) */}
      <Swiper
        onSwiper={setSecondSwiper}
        controller={{
          control: [firstSwiper, thirdSwiper].filter(Boolean) as SwiperType[],
        }}
        speed={1000}
        autoplay={{
          delay: 5500,
          disableOnInteraction: false,
        }}
        pagination={{ clickable: true }}
        navigation={true}
        loop={true}
        modules={[Autoplay, Navigation, Pagination, Controller]}
        className={isTriple ? styles.mainSwiper : styles.singleSwiper}
      >
        {items.map((item) => (
          <SwiperSlide key={`main-${item.id}`} className={styles.swiperSlide}>
            {({ isActive }) => (
              <>
                <div
                  className={styles.slideBackground}
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundImage: `url(${item.backgroundImage})`,
                  }}
                ></div>
                <div className={styles.gradientOverlay}></div>

                <div className={styles.content}>
                  <motion.h1
                    initial={{ y: 40, opacity: 0 }}
                    animate={
                      isActive ? { y: 0, opacity: 1 } : { y: 40, opacity: 0 }
                    }
                    transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                    className="display-3 fw-bold text-white mb-3"
                  >
                    {item.title}
                  </motion.h1>

                  <motion.p
                    initial={{ y: 30, opacity: 0 }}
                    animate={
                      isActive ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }
                    }
                    transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                    className="lead text-white-50 mb-4"
                  >
                    {item.subtitle}
                  </motion.p>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={
                      isActive ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }
                    }
                    transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                    className="d-flex justify-content-center gap-3 flex-wrap"
                  >
                    <Button
                      variant="primary"
                      size="lg"
                      href={item.trailerLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="d-flex align-items-center gap-2 px-4"
                    >
                      <PlayCircle size={24} /> Ver Trailer
                    </Button>
                    <Button
                      variant="outline-light"
                      size="lg"
                      href={item.infoLink}
                      className="d-flex align-items-center gap-2 px-4"
                    >
                      <Info size={24} /> Más Info
                    </Button>
                  </motion.div>
                </div>
              </>
            )}
          </SwiperSlide>
        ))}
      </Swiper>

      {/* CARRUSEL DERECHO (Película Siguiente) */}
      {isTriple && (
        <Swiper
          onSwiper={setThirdSwiper}
          modules={[Controller]}
          loop={true}
          allowTouchMove={false}
          speed={1000}
          className={styles.sideSwiper}
        >
          {items.map((_, idx) => {
            const item = getNextItem(idx);
            return (
              <SwiperSlide
                key={`right-${item.id}`}
                className={styles.swiperSlide}
              >
                <div
                  className={styles.sideSlideBackground}
                  style={{ backgroundImage: `url(${item.backgroundImage})` }}
                ></div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      )}
    </div>
  );
};

export default HeroCarousel;
