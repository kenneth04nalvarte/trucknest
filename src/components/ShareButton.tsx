'use client';

interface ShareButtonProps {
  title: string;
  url: string;
}

export default function ShareButton({ title, url }: ShareButtonProps) {
  const handleShare = async () => {
    const fullUrl = `${window.location.origin}${url}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: fullUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
        fallbackShare(fullUrl);
      }
    } else {
      fallbackShare(fullUrl);
    }
  };

  const fallbackShare = (fullUrl: string) => {
    navigator.clipboard.writeText(fullUrl);
    alert('URL copied to clipboard!');
  };

  return (
    <button
      onClick={handleShare}
      className="bg-orange text-white px-4 py-2 rounded hover:bg-orange/90 transition-colors"
    >
      Share
    </button>
  );
} 