export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="text-center space-y-8">
        <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
          🚀 ERIZON AI 3.0
        </h1>
        
        <p className="text-2xl text-gray-300 font-light">
          Uma empresa completa operada por Inteligência Artificial
        </p>

        <div className="grid grid-cols-2 gap-4 mt-12 max-w-2xl">
          <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
            <h3 className="text-blue-400 font-semibold mb-2">🤖 Multi-Agent</h3>
            <p className="text-sm text-gray-400">30+ agentes especializados</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
            <h3 className="text-purple-400 font-semibold mb-2">🧠 Memória Compartilhada</h3>
            <p className="text-sm text-gray-400">RAG + Vector Search</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
            <h3 className="text-pink-400 font-semibold mb-2">📊 Dashboard</h3>
            <p className="text-sm text-gray-400">KPIs em tempo real</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
            <h3 className="text-green-400 font-semibold mb-2">📱 Publicação Multi-Plataforma</h3>
            <p className="text-sm text-gray-400">Instagram, Facebook, LinkedIn, TikTok</p>
          </div>
        </div>

        <div className="mt-12 space-y-4">
          <p className="text-gray-400">
            Status: <span className="text-yellow-400 font-semibold">Fase 1 - Foundation</span>
          </p>
          <div className="w-full bg-slate-700 rounded-full h-2 max-w-md mx-auto">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full w-1/8"></div>
          </div>
        </div>
      </div>
    </main>
  );
}
