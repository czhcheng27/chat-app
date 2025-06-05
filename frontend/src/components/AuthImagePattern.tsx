import type React from "react";

interface AuthImagePatternProps {
  title: string;
  subtitle: string;
}

const AuthImagePattern: React.FC<AuthImagePatternProps> = ({
  title,
  subtitle,
}) => {
  return (
    <div className="hidden lg:flex items-center justify-center bg-base-200 p-6 min-w-0">
      <div className="max-w-md text-center">
        <div className="w-40 md:w-80 aspect-square grid grid-cols-3 gap-3 mb-8 mx-auto">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className={`w-24 h-24 rounded-2xl bg-primary/10 ${
                i % 2 === 0 ? "animate-pulse" : ""
              }`}
            />
          ))}
        </div>
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-base-content/60">{subtitle}</p>
      </div>
    </div>
  );
};

export default AuthImagePattern;
