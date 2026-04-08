import { useAppContext } from '../lib/store';

export function UserSelector() {
  const { state, dispatch } = useAppContext();
  return (
    <select
      className="user-selector"
      value={state.currentUserId}
      onChange={e => dispatch({ type: 'SWITCH_USER', payload: e.target.value })}
    >
      {Object.values(state.users).map(u => (
        <option key={u.id} value={u.id}>{u.name}</option>
      ))}
    </select>
  );
}
