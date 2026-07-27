sed -i '/const trackRef = useRef<HTMLDivElement>(null);/a\
  const hajiTrackRef = useRef<HTMLDivElement>(null);\
' src/pages/Home.tsx
