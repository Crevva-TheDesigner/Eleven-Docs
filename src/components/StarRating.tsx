import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  className?: string;
  starClassName?: string;
}

export function StarRating({ rating, maxRating = 5, className, starClassName }: StarRatingProps) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: maxRating }).map((_, index) => (
        <Star
          key={index}
          className={cn(
            'h-4 w-4',
            rating > index ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-gray-300',
            starClassName
          )}
        />
      ))}
    </div>
  );
}
