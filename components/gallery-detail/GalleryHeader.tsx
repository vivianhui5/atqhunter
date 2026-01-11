interface GalleryHeaderProps {
  name: string;
}

export default function GalleryHeader({ name }: GalleryHeaderProps) {
  return (
    <div className="gallery-detail-header">
      <h1 className="gallery-detail-title">{name}</h1>
    </div>
  );
}

