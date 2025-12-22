import Link from 'next/link';

interface GalleryHeaderProps {
  name: string;
}

export default function GalleryHeader({ name }: GalleryHeaderProps) {
  return (
    <div className="gallery-detail-header">
      <Link href="/galleries" className="back-link">
        ← Back to Galleries
      </Link>
      <h1 className="gallery-detail-title">{name}</h1>
    </div>
  );
}

