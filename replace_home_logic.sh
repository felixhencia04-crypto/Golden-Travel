sed -i '/export default function Home() {/a\
  const trackRef = useRef<HTMLDivElement>(null);\
\
  useEffect(() => {\
    const track = trackRef.current;\
    if (!track) return;\
\
    let autoSlide: NodeJS.Timeout;\
    const scrollAmount = 380;\
\
    const startAutoSlide = () => {\
      autoSlide = setInterval(() => {\
        if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 10) {\
          track.scrollTo({ left: 0, behavior: '\''smooth'\'' });\
        } else {\
          track.scrollBy({ left: scrollAmount, behavior: '\''smooth'\'' });\
        }\
      }, 4000);\
    };\
\
    startAutoSlide();\
\
    const handleMouseEnter = () => clearInterval(autoSlide);\
    const handleMouseLeave = () => startAutoSlide();\
\
    track.addEventListener('\''mouseenter'\'', handleMouseEnter);\
    track.addEventListener('\''mouseleave'\'', handleMouseLeave);\
\
    return () => {\
      clearInterval(autoSlide);\
      track.removeEventListener('\''mouseenter'\'', handleMouseEnter);\
      track.removeEventListener('\''mouseleave'\'', handleMouseLeave);\
    };\
  }, []);\
\
  const handleNext = () => {\
    if (trackRef.current) {\
      trackRef.current.scrollBy({ left: 380, behavior: '\''smooth'\'' });\
    }\
  };\
\
  const handlePrev = () => {\
    if (trackRef.current) {\
      trackRef.current.scrollBy({ left: -380, behavior: '\''smooth'\'' });\
    }\
  };\
' src/pages/Home.tsx
