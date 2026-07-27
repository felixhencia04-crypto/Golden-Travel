sed -i '/  }, \[\]);/a\
\
  useEffect(() => {\
    const hajiTrack = hajiTrackRef.current;\
    if (!hajiTrack) return;\
\
    let hajiAutoSlide: NodeJS.Timeout;\
    const hajiScrollAmount = 380;\
\
    const startHajiAutoSlide = () => {\
      hajiAutoSlide = setInterval(() => {\
        if (hajiTrack.scrollLeft + hajiTrack.clientWidth >= hajiTrack.scrollWidth - 10) {\
          hajiTrack.scrollTo({ left: 0, behavior: '\''smooth'\'' });\
        } else {\
          hajiTrack.scrollBy({ left: hajiScrollAmount, behavior: '\''smooth'\'' });\
        }\
      }, 4500);\
    };\
\
    startHajiAutoSlide();\
\
    const handleHajiMouseEnter = () => clearInterval(hajiAutoSlide);\
    const handleHajiMouseLeave = () => startHajiAutoSlide();\
\
    hajiTrack.addEventListener('\''mouseenter'\'', handleHajiMouseEnter);\
    hajiTrack.addEventListener('\''mouseleave'\'', handleHajiMouseLeave);\
\
    return () => {\
      clearInterval(hajiAutoSlide);\
      hajiTrack.removeEventListener('\''mouseenter'\'', handleHajiMouseEnter);\
      hajiTrack.removeEventListener('\''mouseleave'\'', handleHajiMouseLeave);\
    };\
  }, []);\
\
  const handleHajiNext = () => {\
    if (hajiTrackRef.current) {\
      hajiTrackRef.current.scrollBy({ left: 380, behavior: '\''smooth'\'' });\
    }\
  };\
\
  const handleHajiPrev = () => {\
    if (hajiTrackRef.current) {\
      hajiTrackRef.current.scrollBy({ left: -380, behavior: '\''smooth'\'' });\
    }\
  };\
' src/pages/Home.tsx
