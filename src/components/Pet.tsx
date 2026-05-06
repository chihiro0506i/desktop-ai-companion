import type { PetAction, PetEmotion } from "../types/pet";

type PetProps = {
  emotion: PetEmotion;
  action: PetAction;
  imageSrc: string;
  name: string;
  size: number;
};

const labelMap: Record<PetEmotion, string> = {
  idle: "idle",
  happy: "happy",
  thinking: "thinking",
  talking: "talking",
  confused: "confused",
  sleepy: "sleeping",
  concerned: "concerned"
};

export function Pet({ emotion, action, imageSrc, name, size }: PetProps) {
  const hasImage = imageSrc.trim().length > 0;

  return (
    <div
      className={`pet pet--${emotion} pet-action--${action} ${hasImage ? "pet--image" : "pet--css"}`}
      style={{ width: size, height: size }}
      aria-label={`${name} ${labelMap[emotion]}`}
    >
      {hasImage ? (
        <img className="pet__image" src={imageSrc} alt={name} draggable={false} />
      ) : (
        <div className="pet__body">
          <div className="pet__face" aria-hidden="true">
            <span className="pet__eye pet__eye--left" />
            <span className="pet__eye pet__eye--right" />
            <span className="pet__mouth" />
          </div>
        </div>
      )}
      <div className="pet__status">{labelMap[emotion]}</div>
      <div className="pet__shadow" />
    </div>
  );
}
