import React, { useState } from 'react';
import { motion } from 'framer-motion';

const DashboardPreview = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hoverCard, setHoverCard] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div 
      className="bg-slate-800 rounded-xl overflow-hidden shadow-2xl w-full max-w-4xl mx-auto"
      whileHover={{ 
        y: -5, 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Top Bar */}
      <div className="bg-slate-900 px-4 py-3 flex justify-between items-center border-b border-slate-700">
        <div className="flex items-center">
          <span className="text-sky-400 font-bold text-lg">JurisIA</span>
        </div>
        <div className="flex space-x-3 items-center">
          <div className="hidden sm:flex items-center mr-4 bg-slate-800 rounded-md px-2 py-1">
            <motion.span 
              className="w-2 h-2 rounded-full bg-green-400 mr-2"
              animate={{ scale: isHovered ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 1, repeat: isHovered ? Infinity : 0 }}
            />
            <span className="text-slate-300 text-xs">Online</span>
          </div>
          <motion.div
            className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-white text-sm border-2 border-sky-500/40"
            whileHover={{ scale: 1.1 }}
          >
            <span>DR</span>
          </motion.div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="bg-slate-900 w-48 h-96 hidden sm:block px-3 py-4">
          <nav>
            {[
              { id: 'dashboard', name: 'Dashboard', icon: '📊' },
              { id: 'documentos', name: 'Documentos', icon: '📝' },
              { id: 'processos', name: 'Processos', icon: '⚖️' },
              { id: 'clientes', name: 'Clientes', icon: '👥' },
              { id: 'configuracoes', name: 'Configurações', icon: '⚙️' },
            ].map((item) => (
              <motion.div
                key={item.id}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md cursor-pointer mb-1 ${
                  activeTab === item.id
                    ? 'bg-blue-800 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
                onClick={() => setActiveTab(item.id)}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.95 }}
                animate={{ 
                  backgroundColor: item.id === activeTab && isHovered ? ['rgba(30, 64, 175, 0.8)', 'rgba(30, 64, 175, 1)', 'rgba(30, 64, 175, 0.8)'] : undefined
                }}
                transition={{ duration: 2, repeat: item.id === activeTab && isHovered ? Infinity : 0 }}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </motion.div>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="mb-6">
            <h2 className="text-white text-xl font-bold mb-1">Bem-vindo, Dr. Rafael</h2>
            <p className="text-slate-400">Acompanhe seus casos e documentos</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { name: 'Documentos', count: 42, color: 'from-blue-500 to-blue-600' },
              { name: 'Processos', count: 18, color: 'from-teal-500 to-teal-600' },
              { name: 'Consultas', count: 7, color: 'from-purple-500 to-purple-600' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className={`bg-gradient-to-r ${stat.color} rounded-lg p-4 text-white shadow-lg`}
                whileHover={{ y: -5, scale: 1.02 }}
                onMouseEnter={() => setHoverCard(index)}
                onMouseLeave={() => setHoverCard(null)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  boxShadow: hoverCard === index ? '0 10px 25px -5px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-sm opacity-75">{stat.name}</div>
                <div className="text-2xl font-bold">{stat.count}</div>
                <motion.div 
                  className="mt-2 text-xs opacity-75"
                  animate={{ 
                    opacity: hoverCard === index ? [0.75, 1, 0.75] : 0.75 
                  }}
                  transition={{ duration: 1.5, repeat: hoverCard === index ? Infinity : 0 }}
                >
                  {index === 0 && '+12 na última semana'}
                  {index === 1 && '+3 na última semana'}
                  {index === 2 && '+2 na última semana'}
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* Recent Documents */}
          <div className="bg-slate-900 rounded-lg p-4 shadow-inner">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold">Documentos recentes</h3>
              <motion.button 
                className="text-sky-400 text-sm hover:underline"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Ver todos
              </motion.button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-slate-700">
                    <th className="pb-2 text-slate-400 font-medium text-sm">Nome</th>
                    <th className="pb-2 text-slate-400 font-medium text-sm">Data</th>
                    <th className="pb-2 text-slate-400 font-medium text-sm">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Petição Inicial - Caso Silva', date: '18/06/2023', type: 'Petição', color: 'bg-blue-900/30 text-blue-400' },
                    { name: 'Contrato de Locação', date: '15/06/2023', type: 'Contrato', color: 'bg-green-900/30 text-green-400' },
                    { name: 'Recurso - Processo nº 5021...', date: '10/06/2023', type: 'Recurso', color: 'bg-red-900/30 text-red-400' },
                  ].map((doc, index) => (
                    <motion.tr
                      key={index}
                      className="border-b border-slate-800 text-sm"
                      whileHover={{ backgroundColor: 'rgba(30, 41, 59, 0.5)' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      <td className="py-3 text-white">{doc.name}</td>
                      <td className="py-3 text-white">{doc.date}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${doc.color}`}>
                          {doc.type}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {/* Floating notification indicator */}
      <motion.div 
        className="absolute top-3 right-16 w-2 h-2 bg-red-500 rounded-full hidden sm:block"
        initial={{ scale: 0 }}
        animate={{ 
          scale: isHovered ? [1, 1.5, 1] : 1,
          opacity: isHovered ? [1, 0.7, 1] : 1
        }}
        transition={{ duration: 1, repeat: isHovered ? Infinity : 0 }}
      />
    </motion.div>
  );
};

export default DashboardPreview; 