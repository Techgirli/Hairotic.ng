import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  initialSeconds?: number;
  onExpire?: () => void;
}

export default function CountdownTimer({ initialSeconds = 600, onExpire }: CountdownTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (onExpire) onExpire();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onExpire]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <span className="font-mono font-semibold text-[#E56717]">
      {formatTime(secondsLeft)}
    </span>
  );
}
