import type { PetAction, PetEmotion } from "../types/pet";

type PetProps = {
  emotion: PetEmotion;
  action: PetAction;
  imageSrc: string;
  name: string;
  size: number;
};

const faceMap: Record<PetEmotion, string> = {
  idle: "^_^",
  happy: "^o^",
  thinking: "o_o",
  talking: "^.^",
  confused: "?_?",
  sleepy: "-_-",
  concerned: "._."
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
        <>
          <div className="pet__ear pet__ear--left" />
          <div className="pet__ear pet__ear--right" />
          <div className="pet__body">
            <div className="pet__face">{faceMap[emotion]}</div>
          </div>
        </>
      )}
      <div className="pet__status">{labelMap[emotion]}</div>
      <div className="pet__shadow" />
    </div>
  );
}
