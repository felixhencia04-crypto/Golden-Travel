sed -i '95c\
    }\
  };\
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {\
' src/pages/Home.tsx
sed -i '111d' src/pages/Home.tsx
