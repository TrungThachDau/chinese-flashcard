import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export default async function TodosPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos } = await supabase.from('todos').select();

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Supabase Todos Test</h1>
      <ul className="list-disc pl-5">
        {todos?.map((todo: { id: string | number; name: string }) => (
          <li key={todo.id}>{todo.name}</li>
        ))}
      </ul>
      {(!todos || todos.length === 0) && (
        <p className="text-sm text-gray-500 mt-2">
          No todos found or &apos;todos&apos; table not yet created in Supabase.
        </p>
      )}
    </div>
  );
}

