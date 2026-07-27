import React, { useState, useEffect, useMemo, useCallback } from 'react';
import TaskCard from './components/TaskCard';
import { Plus, BookOpen, Calendar, Sparkles, Loader2, CloudOff, RefreshCw, FileText, X } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ubdmdmigxlrelvvpreei.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_BVz4xLvnUOJuoMH5OO4bBQ_U_Js0eZl';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function App() {
  const todayStr = useMemo(() => getLocalDateString(), []);

  const [tasks, setTasks] = useState([]);
  const [selectedFilterDate, setSelectedFilterDate] = useState('ALL');
  const [customDateFilter, setCustomDateFilter] = useState(todayStr);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // 1. CARREGAR DADOS DO SUPABASE
  const fetchTasksFromCloud = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTasks = (data || []).map((t) => ({
        id: t.id,
        title: t.title,
        category: t.category,
        dueDate: t.due_date,
        dueTime: t.due_time,
        completed: t.completed,
        timeSpent: t.time_spent,
        isRunning: false,
        createdAt: t.created_at,
      }));

      setTasks(formattedTasks);
      setSyncError(false);
    } catch (error) {
      console.error('Erro ao buscar do Supabase:', error);
      setSyncError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTasksFromCloud();

    const channel = supabase
      .channel('public:tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasksFromCloud();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasksFromCloud]);

  // CRUD COM SUPABASE
  const handleAddTask = useCallback(async (newTask) => {
    setTasks((prev) => [newTask, ...prev]);

    try {
      const { error } = await supabase.from('tasks').insert([
        {
          id: newTask.id,
          title: newTask.title,
          category: newTask.category,
          due_date: newTask.dueDate,
          due_time: newTask.dueTime,
          completed: newTask.completed,
          time_spent: newTask.timeSpent,
        },
      ]);
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao inserir tarefa:', error);
      setSyncError(true);
    }
  }, []);

  const handleUpdateTask = useCallback(async (id, updatedFields) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updatedFields } : t))
    );

    const dbFields = {};
    if (updatedFields.title !== undefined) dbFields.title = updatedFields.title;
    if (updatedFields.category !== undefined) dbFields.category = updatedFields.category;
    if (updatedFields.dueDate !== undefined) dbFields.due_date = updatedFields.dueDate;
    if (updatedFields.dueTime !== undefined) dbFields.due_time = updatedFields.dueTime;
    if (updatedFields.completed !== undefined) dbFields.completed = updatedFields.completed;
    if (updatedFields.timeSpent !== undefined) dbFields.time_spent = updatedFields.timeSpent;

    try {
      const { error } = await supabase.from('tasks').update(dbFields).eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      setSyncError(true);
    }
  }, []);

  const handleDeleteTask = useCallback(async (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error);
      setSyncError(true);
    }
  }, []);

  // Filtros Avançados
  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (selectedFilterDate === 'TODAY') {
      result = tasks.filter((t) => t.dueDate === todayStr);
    } else if (selectedFilterDate === 'CUSTOM') {
      result = tasks.filter((t) => t.dueDate === customDateFilter);
    }
    return result.sort((a, b) => (a.dueTime || '23:59').localeCompare(b.dueTime || '23:59'));
  }, [tasks, selectedFilterDate, customDateFilter, todayStr]);

  const totalHours = useMemo(() => {
    const totalSeconds = filteredTasks.reduce((acc, t) => acc + (t.timeSpent || 0), 0);
    return (totalSeconds / 3600).toFixed(1);
  }, [filteredTasks]);

  // Gerador de Relatório em Texto
  const reportText = useMemo(() => {
    const periodLabel = 
      selectedFilterDate === 'TODAY' ? `Hoje (${todayStr})` :
      selectedFilterDate === 'CUSTOM' ? `Data específica (${customDateFilter})` : 'Todas as Datas';

    let text = `=== RELATÓRIO LIFEHUB PLANNER ===\n`;
    text += `Período: ${periodLabel}\n`;
    text += `Total de Horas Focadas: ${totalHours}h\n`;
    text += `Total de Tarefas: ${filteredTasks.length}\n\n`;
    text += `--- LISTA DE TAREFAS ---\n`;
    
    filteredTasks.forEach((t, index) => {
      const status = t.completed ? '[CONCLUÍDA]' : '[PENDENTE]';
      const horas = (t.timeSpent / 3600).toFixed(1);
      text += `${index + 1}. ${t.title} (${t.category}) - Data: ${t.dueDate} às ${t.dueTime || '00:00'} - Status: ${status} - Foco: ${horas}h\n`;
    });

    return text;
  }, [filteredTasks, selectedFilterDate, customDateFilter, todayStr, totalHours]);

  return (
    <div style={styles.pageBackground}>
      <div style={styles.container}>
        {syncError && (
          <div style={styles.warningAlert}>
            <CloudOff size={16} />
            <span>Atenção: Houve um pequeno problema na sincronização com o Supabase.</span>
          </div>
        )}

        {/* HEADER */}
        <div style={styles.bannerContainer}>
          <div>
            <div style={styles.badge}>
              <BookOpen size={14} />
              <span>Meu Planner Pessoal</span>
            </div>
            <h1 style={styles.bannerTitle}>Agenda & Foco Diário</h1>
            <p style={styles.bannerSubtitle}>
              Organize suas metas por horário e acompanhe seu tempo dedicado.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setShowReportModal(true)} 
              title="Gerar Relatório"
              style={styles.actionBtn}
            >
              <FileText size={16} /> Relatório
            </button>

            <button 
              onClick={() => fetchTasksFromCloud(true)} 
              disabled={refreshing} 
              title="Recarregar dados"
              style={styles.refreshBtn}
            >
              <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </button>

            <div style={styles.statsContainer}>
              <div style={styles.statBox}>
                <span style={styles.statLabel}>Horas Focadas</span>
                <div style={{ ...styles.statValue, color: '#38bdf8' }}>{totalHours}h</div>
              </div>
              <div style={styles.statDivider} />
              <div style={styles.statBox}>
                <span style={styles.statLabel}>Tarefas</span>
                <div style={{ ...styles.statValue, color: '#4ade80' }}>{filteredTasks.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* FORMULARIO */}
        <TaskForm onAddTask={handleAddTask} todayStr={todayStr} loading={loading} />

        {/* LISTA DE COMPROMISSOS COM FILTROS */}
        <div style={styles.card}>
          <div style={styles.filterHeader}>
            <div style={styles.filterTitle}>
              <Calendar size={18} color="#3b82f6" />
              <span>Compromissos Agendados</span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setSelectedFilterDate('TODAY')}
                style={styles.filterButton(selectedFilterDate === 'TODAY')}
              >
                Hoje
              </button>
              <button
                onClick={() => setSelectedFilterDate('ALL')}
                style={styles.filterButton(selectedFilterDate === 'ALL')}
              >
                Todas
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="date"
                  value={customDateFilter}
                  onChange={(e) => {
                    setCustomDateFilter(e.target.value);
                    setSelectedFilterDate('CUSTOM');
                  }}
                  style={styles.dateInputFilter}
                />
              </div>
            </div>
          </div>

          <div>
            {loading ? (
              <div style={styles.emptyState}>
                <Loader2 size={32} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ margin: '10px 0 0 0', fontSize: '14px' }}>Carregando compromissos...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div style={styles.emptyState}>
                <BookOpen size={40} color="#cbd5e1" style={{ marginBottom: '8px' }} />
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>
                  Nenhum compromisso encontrado para este filtro.
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                  Adicione uma nova tarefa ou altere a data selecionada!
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={handleUpdateTask}
                  onDelete={handleDeleteTask}
                />
              ))
            )}
          </div>
        </div>

        {/* MODAL DE RELATÓRIO */}
        {showReportModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
                  <FileText size={20} color="#2563eb" /> Relatório de Atividades
                </h3>
                <button onClick={() => setShowReportModal(false)} style={styles.closeModalBtn}>
                  <X size={18} />
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>
                Resumo baseado no filtro atual selecionado na tela.
              </p>
              <textarea
                readOnly
                value={reportText}
                style={styles.reportTextArea}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(reportText);
                    alert('Relatório copiado para a área de transferência!');
                  }}
                  style={styles.btnPrimary}
                >
                  Copiar Relatório
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskForm({ onAddTask, todayStr, loading }) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [category, setCategory] = useState('Trabalho');
  const [dueDate, setDueDate] = useState(todayStr);
  const [dueTime, setDueTime] = useState('09:00');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || loading) return;

    onAddTask({
      id: Date.now().toString(),
      title: newTaskTitle,
      category,
      dueDate,
      dueTime,
      completed: false,
      timeSpent: 0,
      isRunning: false,
      createdAt: new Date().toISOString(),
    });

    setNewTaskTitle('');
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.sectionTitle}>
        <Sparkles size={16} color="#3b82f6" />
        Adicionar Novo Agendamento
      </h3>

      <form onSubmit={handleSubmit} style={styles.formRow}>
        <input
          type="text"
          name="taskTitle"
          id="taskTitle"
          placeholder="O que vamos realizar?"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          disabled={loading}
          style={{ ...styles.input, flex: '1 1 200px' }}
        />
        <input
          type="date"
          name="dueDate"
          id="dueDate"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          disabled={loading}
          style={styles.inputControl}
        />
        <input
          type="time"
          name="dueTime"
          id="dueTime"
          value={dueTime}
          onChange={(e) => setDueTime(e.target.value)}
          disabled={loading}
          style={{ ...styles.inputControl, fontFamily: 'monospace' }}
        />
        <select
          name="category"
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={loading}
          style={styles.inputControl}
        >
          <option value="Trabalho">Trabalho 💼</option>
          <option value="Estudos">Estudos 📚</option>
          <option value="Saúde">Saúde 🌿</option>
          <option value="Pessoal">Pessoal 🏠</option>
        </select>
        <button type="submit" disabled={loading} style={styles.btnPrimary}>
          <Plus size={16} /> Agendar
        </button>
      </form>
    </div>
  );
}

const styles = {
  pageBackground: {
    backgroundColor: '#f1f5f9',
    backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
    backgroundSize: '20px 20px',
    minHeight: '100vh',
    padding: '30px 15px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  warningAlert: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    padding: '10px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  bannerContainer: {
    backgroundColor: '#1e293b',
    color: '#ffffff',
    borderRadius: '20px',
    padding: '24px 30px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    border: '1px solid #334155',
    flexWrap: 'wrap',
    gap: '15px',
  },
  refreshBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff',
    padding: '10px',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    backgroundColor: '#2563eb',
    border: 'none',
    color: '#fff',
    padding: '10px 14px',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    color: '#38bdf8',
    marginBottom: '8px',
  },
  bannerTitle: { margin: 0, fontSize: '26px', fontWeight: '800' },
  bannerSubtitle: { margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' },
  statsContainer: {
    display: 'flex',
    gap: '15px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: '12px 20px',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  statBox: { textAlign: 'center' },
  statLabel: {
    fontSize: '10px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  statValue: { fontSize: '20px', fontWeight: '800' },
  statDivider: { width: '1px', backgroundColor: 'rgba(255,255,255,0.1)' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    color: '#475569',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  formRow: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  input: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
  },
  inputControl: {
    padding: '10px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    backgroundColor: '#f8fafc',
  },
  dateInputFilter: {
    padding: '6px 10px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '12px',
    backgroundColor: '#f8fafc',
  },
  btnPrimary: {
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '10px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
  },
  filterHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #f1f5f9',
    flexWrap: 'wrap',
    gap: '10px',
  },
  filterTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#334155',
  },
  filterButton: (isActive) => ({
    backgroundColor: isActive ? '#3b82f6' : '#f1f5f9',
    color: isActive ? '#ffffff' : '#64748b',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
  }),
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#94a3b8',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '15px',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxWidth: '600px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  closeModalBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#64748b',
  },
  reportTextArea: {
    width: '100%',
    height: '250px',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontFamily: 'monospace',
    fontSize: '12px',
    backgroundColor: '#f8fafc',
    resize: 'none',
    outline: 'none',
  },
};