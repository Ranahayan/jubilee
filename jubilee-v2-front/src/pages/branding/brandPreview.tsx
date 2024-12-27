import { use } from "i18next";
import { useRef, useEffect, useState, useCallback } from "react";
import ExampleProduct from "~/assets/png/example-product.png";

declare const WebFont: any;

interface BradingPreviewProps {
  brandName?: string;
  fontFamily?: string;
}

const BrandingPreview = ({ brandName = "Brand name", fontFamily = "Roboto" }: BradingPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [image] = useState<HTMLImageElement>(new Image());
  const [fontImage] = useState<HTMLImageElement>(new Image());
  const [fontsLoaded, setFontsLoaded] = useState(false);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');

      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        drawTextImage(context, fontImage);
      }
    }
  }, [canvasRef, image]);

  useEffect(() => {
    setFontsLoaded(false);
    fontImage.src = getTheTextImage(brandName || 'Brand Name', fontFamily);
    fontImage.onload = () => render();
  }, [brandName, fontFamily, fontsLoaded]);

  useEffect(() => {
    image.src = ExampleProduct;
    image.onload = () => render();
  }, []);

  useEffect(() => {
    WebFont.load({
      google: {
        families: [fontFamily || "Roboto"]
      },
      active: () => setFontsLoaded(true)
    });
  }, [fontFamily]);

  return <canvas width={400} height={300} ref={canvasRef} />;
};

function getTheTextImage(text: string, fontFamily: string) {
  /* 
  * This function is used to create a canvas element, draw the text on it and then return the dataURL of the canvas.
  * This dataURL is then used to display the text on the branding page.
  */
  const textCanvas = document.createElement('canvas');
  textCanvas.width = 1200;
  textCanvas.height = 200;
  let textCtx = textCanvas.getContext('2d') as CanvasRenderingContext2D;

  textCtx.fillStyle = '#fff';
  textCtx.font = `${20}px ${fontFamily}`;
  textCtx.fillText(text, 5, 100);

  const imageData = textCtx.getImageData(0, 0, textCanvas.width, textCanvas.height);
  const data = imageData.data;
  let minX = textCanvas.width, minY = textCanvas.height, maxX = 0, maxY = 0;

  for(let y = 0; y < textCanvas.height; y++) {
      for(let x = 0; x < textCanvas.width; x++) {
          const alpha = data[(y * textCanvas.width + x) * 4 + 3];
          if(alpha > 0) {
              minX = Math.min(minX, x);
              maxX = Math.max(maxX, x);
              minY = Math.min(minY, y);
              maxY = Math.max(maxY, y);
          }
      }
  }

  const width = maxX - minX + 10;
  const height = maxY - minY + 10;
  const capturedImageData = textCtx.getImageData(minX, minY, width, height);
  
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = width;
  finalCanvas.height = height;
  let finalCtx = finalCanvas.getContext('2d') as CanvasRenderingContext2D;

  finalCtx.putImageData(capturedImageData, 5, 5); 
  return finalCanvas.toDataURL();
}

function drawTextImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  ctx.save();
  const width = 200;
  const height = 20;
  const angle = -90;
  const origin = { x: 170, y: 287 };
  
  const destAspectRatio = width / height;
  const imgAspectRatio = img.width / img.height;

  let drawWidth, drawHeight;
  if (destAspectRatio > imgAspectRatio) {
      drawHeight = height;
      drawWidth = img.width * (drawHeight / img.height);
  } else {
      drawWidth = width;
      drawHeight = img.height * (drawWidth / img.width);
  }

  const radians = angle * (Math.PI / 180);
  ctx.translate(origin.x, origin.y);
  ctx.rotate(radians);
  ctx.drawImage(img, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
  ctx.restore();
}

export default BrandingPreview;