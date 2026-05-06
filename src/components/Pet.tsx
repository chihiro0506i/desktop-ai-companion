import type { PetAction, PetEmotion } from "../types/pet";

type PetProps = {
  emotion: PetEmotion;
  action: PetAction;
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

export function Pet({ emotion, action, size }: PetProps) {
  return (
    <div
      className={`pet pet--${emotion} pet-action--${action}`}
      style={{ width: size, height: size }}
      aria-label={`pet ${labelMap[emotion]}`}
    >
      <div className="pet__ear pet__ear--left" />
      <div className="pet__ear pet__ear--right" />
      <div className="pet__body">
        <div className="pet__face">{faceMap[emotion]}</div>
        <div className="pet__status">{labelMap[emotion]}</div>
      </div>
      <div className="pet__shadow" />
    </div>
  );
}
