import React, { useState, useEffect } from 'react';
import TaskCard from './components/TaskCard';
import { Plus, BookOpen, Calendar, Filter, Sparkles } from 'lucide-react';

export default function App() {
  const todayStr = new Date().toISOString().split('T')[0];

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('lifehub_planner_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [category, setCategory] = useState('Trabalho');
  const [dueDate, setDueDate] = useState(todayStr);
  const [dueTime, setDueTime] = useState('09:00');
  const [selectedFilterDate, setSelectedFilterDate] = useState(todayStr);

  useEffect(() => {
    localStorage.setItem('lifehub_planner_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask = {
      id: Date.now().toString(),
      title: newTaskTitle,
      category: category,
      dueDate: dueDate,
      dueTime: dueTime,
      completed: false,
      timeSpent: 0,
      isRunning: false,
      createdAt: new Date().toISOString()
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
  };

  const updateTask = (id, updatedFields) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updatedFields } : t));
  };

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const filteredTasks = (selectedFilterDate === 'ALL'
    ? tasks
    : tasks.filter(t => t.dueDate === selectedFilterDate)
  ).sort((a, b) => (a.dueTime || '23:59').localeCompare(b.dueTime || '23:59'));

  const totalSeconds = filteredTasks.reduce((acc, t) => acc + (t.timeSpent || 0), 0);
  const totalHours = (totalSeconds / 3600).toFixed(1);

  return (
    <div style={{
      backgroundColor: '#f1f5f9',
      backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
      backgroundSize: '20px 20px',
      minHeight: '100vh',
      padding: '30px 15px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* BLOCO 1: BANNER DE AGENDA / PLANNER */}
        <div style={{
          backgroundColor: '#1e293b',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '24px 30px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          border: '1px solid #334155'
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', color: '#38bdf8', marginBottom: '8px' }}>
              <BookOpen size={14} />
              <span>Meu Planner Pessoal</span>
            </div>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '800' }}>Agenda & Foco Diário</h1>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>Organize suas metas por horário e acompanhe seu tempo dedicado.</p>
          </div>

          <div style={{ display: 'flex', gap: '15px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '12px 20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Horas Focadas</span>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#38bdf8' }}>{totalHours}h</div>
            </div>
            <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Tarefas</span>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#4ade80' }}>{filteredTasks.length}</div>
            </div>
          </div>
        </div>

        {/* BLOCO 2: JANELA DE NOVO AGENDAMENTO */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="#3b82f6" />
            Adicionar Novo Agendamento
          </h3>

          <form onSubmit={addTask} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="O que vamos realizar hoje?"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              style={{
                flex: '1 1 200px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{ padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#f8fafc' }}
            />
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              style={{ padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#f8fafc', fontFamily: 'monospace' }}
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#f8fafc' }}
            >
              <option value="Trabalho">Trabalho 💼</option>
              <option value="Estudos">Estudos 📚</option>
              <option value="Saúde">Saúde 🌿</option>
              <option value="Pessoal">Pessoal 🏠</option>
            </select>
            <button
              type="submit"
              style={{
                backgroundColor: '#2563eb',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Plus size={16} /> Agendar
            </button>
          </form>
        </div>

        {/* BLOCO 3: JANELA DA AGENDA / LISTA DE TAREFAS */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0'
        }}>
          {/* Barra de Filtro */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '1px solid #f1f5f9'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 'bold', color: '#334155' }}>
              <Calendar size={18} color="#3b82f6" />
              <span>Compromissos Agendados</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setSelectedFilterDate(todayStr)}
                style={{
                  backgroundColor: selectedFilterDate === todayStr ? '#3b82f6' : '#f1f5f9',
                  color: selectedFilterDate === todayStr ? '#ffffff' : '#64748b',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                Hoje
              </button>
              <button
                onClick={() => setSelectedFilterDate('ALL')}
                style={{
                  backgroundColor: selectedFilterDate === 'ALL' ? '#3b82f6' : '#f1f5f9',
                  color: selectedFilterDate === 'ALL' ? '#ffffff' : '#64748b',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                Todas
              </button>
            </div>
          </div>

          {/* Lista de Fichas */}
          <div>
            {filteredTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                <BookOpen size={40} color="#cbd5e1" style={{ marginBottom: '8px' }} />
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>Nenhum compromisso para este dia.</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>Aproveite o tempo livre ou adicione uma nova tarefa no bloco acima!</p>
              </div>
            ) : (
              filteredTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={updateTask}
                  onDelete={deleteTask}
                />
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}