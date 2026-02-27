type ProfileItemProps = {
  label: string;
  value: string;
};

export default function ProfileItem({ label, value }: ProfileItemProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
      <p className="text-sm font-semibold text-green-600">
        {label}
      </p>
      <p className="text-base font-medium text-gray-900 dark:text-gray-100">
        {value}
      </p>
    </div>
  );
}
