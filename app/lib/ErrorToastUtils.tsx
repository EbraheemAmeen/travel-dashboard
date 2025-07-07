import toast from 'react-hot-toast';

export const showErrorToast = (message: string) => {
  toast.custom((t) => (
    <div
      className={`bg-red-800 text-white   px-6 py-4 rounded-lg shadow-md max-w-sm w-full animate-slide-in transition duration-400`}
    >
      <div className="text-l">{message}</div>
      
    </div>
  ));
};
