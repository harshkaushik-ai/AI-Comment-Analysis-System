
export default function PoweredBy() {
  return (
    <div className="flex justify-center items-center space-x-2 text-sm">
      <span className="text-gray-400">Powered by</span>
      <img
        src="https://huggingface.co/front/assets/huggingface_logo-noborder.svg"
        alt="Hugging Face"
        className="h-5 w-5"
      />
      <span className="text-blue-400 font-medium">Hugging Face AI</span>
    </div>
  );
}
