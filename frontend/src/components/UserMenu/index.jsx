import UserButton from "./UserButton";

export default function UserMenu({ children }) {
  return (
    <div className="flex-1 h-auto">
      <UserButton />
      {children}
    </div>
  );
}
