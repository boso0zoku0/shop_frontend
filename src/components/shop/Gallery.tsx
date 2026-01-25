
import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Film {
  id: number;
  name: string;
  genre: string;
  release_year: string;
  story?: string;
  gallery?: string[];
}

interface FilmGalleryProps {
  film: Film;
}

export default function FilmGallery({ film }: FilmGalleryProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openModal = (index: number) => {
    setCurrentImageIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const nextImage = () => {
    if (film.gallery) {
      setCurrentImageIndex((prev) => (prev + 1) % film.gallery!.length);
    }
  };

  const prevImage = () => {
    if (film.gallery) {
      setCurrentImageIndex(
        (prev) => (prev - 1 + film.gallery!.length) % film.gallery!.length
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") nextImage();
    if (e.key === "ArrowLeft") prevImage();
    if (e.key === "Escape") closeModal();
  };

  if (!film.gallery || film.gallery.length === 0) return null;

  return (
    <>
      {/* Миниатюры галереи */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 ">
        {film.gallery.map((image, index) => (
          <div
            key={index}
            className="relative aspect-video overflow-hidden rounded-lg cursor-pointer group"
            onClick={() => openModal(index)}
          >
            <img
              src={image}
              alt={`${film.name} - изображение ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
          </div>
        ))}
      </div>

      {/* Модальное окно с полноэкранной галереей */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeModal}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Кнопка закрытия */}
          <button
            className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors"
            onClick={closeModal}
            aria-label="Закрыть"
          >
            <X size={32} />
          </button>

          {/* Кнопка предыдущего изображения */}
          {film.gallery && film.gallery.length > 1 && (
            <button
              className="absolute left-4 z-10 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2"
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              aria-label="Предыдущее изображение"
            >
              <ChevronLeft size={40} />
            </button>
          )}

          {/* Изображение */}
          <div
            className="max-w-7xl max-h-[90vh] flex items-center justify-center px-16"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              width={500}
              height={500}
              src={film.gallery![currentImageIndex]}
              alt={`${film.name} - изображение ${currentImageIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>

          {/* Кнопка следующего изображения */}
          {film.gallery && film.gallery.length > 1 && (
            <button
              className="absolute right-4 z-10 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2"
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              aria-label="Следующее изображение"
            >
              <ChevronRight size={40} />
            </button>
          )}

          {/* Счетчик изображений */}
          {film.gallery && film.gallery.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full">
              {currentImageIndex + 1} / {film.gallery.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}