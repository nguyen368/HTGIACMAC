import React from 'react';

const ImageOverlay = ({ bbox }) => {
  // Nếu không có tọa độ hoặc mảng rỗng thì không vẽ gì cả
  if (!bbox || !Array.isArray(bbox) || bbox.length < 4) return null;

  const [x, y, w, h] = bbox;

  const style = {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: `${w}px`,
    height: `${h}px`,
    border: '3px solid red',
    backgroundColor: 'rgba(255, 0, 0, 0.1)', // Màu nền đỏ nhạt
    pointerEvents: 'none', // Để chuột có thể bấm xuyên qua
    zIndex: 10
  };

  return <div style={style} title="AI Detection Area" />;
};

export default ImageOverlay;