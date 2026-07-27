sed -i '96i\
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {\
    e.preventDefault();\
    const element = document.getElementById(sectionId);\
    if (element) {\
      const headerOffset = 80;\
      const elementPosition = element.getBoundingClientRect().top;\
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;\
      window.scrollTo({\
        top: offsetPosition,\
        behavior: "smooth"\
      });\
    }\
  };\
' src/pages/Home.tsx
