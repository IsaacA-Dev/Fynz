import { useState } from 'react';

function ExpenseForm({ onAdd }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Personal');

  const categories = ['Personal', 'Emergencia', 'Vacaciones', 'Educación', 'Inversión'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onAdd(name, amount, category)) {
      setName('');
      setAmount('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <input 
        type="text" 
        placeholder="¿En qué gastaste?" 
        value={name} 
        onChange={e => setName(e.target.value)} 
        required 
      />
      <input 
        type="number" 
        placeholder="Monto" 
        value={amount} 
        onChange={e => setAmount(e.target.value)} 
        step="0.01" 
        required 
      />
      <select value={category} onChange={e => setCategory(e.target.value)}>
        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
      </select>
      <button type="submit">Agregar</button>
    </form>
  );
}

export default ExpenseForm;