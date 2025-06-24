import reactLogo from '@/assets/imgs/react.svg';
import viteLogo from '/vite.svg';

function App() {
  return (
    <div className="h-full w-full flex flex-col gap-y-[24px] items-center justify-center">
      <div className="flex gap-x-[32px]">
        <a href="https://vite.dev" target="_blank" rel="noopener">
          <img
            src={viteLogo}
            alt="Vite logo"
            className="w-[56px] h-[56px] animate-"
          />
        </a>
        <a href="https://react.dev" target="_blank" rel="noopener">
          <img
            src={reactLogo}
            alt="React logo"
            className="w-[56px] h-[56px] animate-bounce"
          />
        </a>
      </div>
      <h1 className="text-red font-bold text-[32px]">
        Vite + React + Rolldown + Oxc + UnoCSS
      </h1>
    </div>
  );
}

export default App;
