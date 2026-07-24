import React, { useState, useEffect } from 'react';
import { Play, Pause, Trash2, CheckCircle2, Circle, Clock, Calendar, Briefcase, GraduationCap, Heart, Home } from 'lucide-react';
import { formatSeconds } from '../utils/formatTime';

const categoryColors = {
  Trabalho: { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
  Estudos: { bg: '#f3e8ff', color: '#6b21a8', border: '#e9d5ff' },
  Saúde: { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
  Pessoal: { bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
};

export default function TaskCard({ task, onUpdate, onDelete }) {
  const [isRunning, setIsRunning] = useState(task.isRunning || false);
  const [timeSpent, setTimeSpent] = useState(task.timeSpent || 0);

  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeSpent((prev) => {
          const newTime = prev + 1;
          onUpdate(task.id, { timeSpent: newTime, isRunning: true });
          return newTime;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, task.id]);

  const toggleTimer = () => {
    const nextState = !isRunning;
    setIsRunning(nextState);
    onUpdate(task.id, { isRunning: nextState, timeSpent });
  };

  const toggleComplete = () => {
    if (isRunning) setIsRunning(false);
    onUpdate(task.id, { completed: !task.completed, isRunning: false, timeSpent });
  };

  const catStyle = categoryColors[task.category] || categoryColors.Pessoal;

  return (
    <div style={{
      backgroundColor: task.completed ? '#f1f5f9' : '#ffffff',
      borderLeft: `5px solid ${task.completed ? '#94a3b8' : '#3b82f6'}`,
      borderRadius: '12px',
      padding: '16px 20px',
      marginBottom: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      opacity: task.completed ? 0.7 : 1
    }}>
      {/* Esquerda: Checkbox + Título + Tags */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
        <button 
          onClick={toggleComplete}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          {task.completed ? (
            <CheckCircle2 size={24} color="#10b981" />
          ) : (
            <Circle size={24} color="#cbd5e1" />
          )}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ 
            fontWeight: '600', 
            fontSize: '15px', 
            color: '#1e293b',
            textDecoration: task.completed ? 'line-through' : 'none'
          }}>
            {task.title}
          </span>

          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#64748b' }}>
            {task.dueDate && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={13} color="#3b82f6" />
                {task.dueDate.split('-').reverse().join('/')}
              </span>
            )}
            {task.dueTime && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                <Clock size={13} color="#f59e0b" />
                {task.dueTime}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Centro: Tag de Categoria */}
      <span style={{
        backgroundColor: catStyle.bg,
        color: catStyle.color,
        border: `1px solid ${catStyle.border}`,
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        {task.category}
      </span>

      {/* Direita: Cronômetro e Botões */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          backgroundColor: isRunning ? '#e0f2fe' : '#f1f5f9',
          color: isRunning ? '#0284c7' : '#475569',
          padding: '6px 12px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '13px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Clock size={14} />
          {formatSeconds(timeSpent)}
        </div>

        {!task.completed && (
          <button
            onClick={toggleTimer}
            style={{
              backgroundColor: isRunning ? '#f59e0b' : '#3b82f6',
              color: '#fff',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 'bold',
              fontSize: '12px'
            }}
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} />}
            {isRunning ? 'Pausar' : 'Focar'}
          </button>
        )}

        <button
          onClick={() => onDelete(task.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}