import toast from 'react-hot-toast';

export const showSuccsesToast = (message: string) => {
  toast.custom((t) => (
    <div
      className={`bg-green-500   px-6 py-4 rounded-lg shadow-md max-w-sm w-full animate-slide-in transition duration-400`}
    >
      <div className="text-lg">{message}</div>
     
    </div>
  ));
};
