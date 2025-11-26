// StockAlerts.jsx
function StockAlerts() {
  const [alertas, setAlertas] = useState([]);

  useEffect(() => {
    const fetchAlertas = async () => {
      const { data } = await supabase
        .from('inventario')
        .select('*')
        .lte('cantidad', 'min_stock');
      setAlertas(data);
    };
    fetchAlertas();

    // Suscripción en tiempo real
    const subscription = supabase
      .channel('inventario')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'inventario',
        },
        fetchAlertas
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div>
      <h3>Alertas de Stock</h3>
      {alertas.map((item) => (
        <Alert key={item.id} variant="danger">
          {item.nombre} - Stock: {item.cantidad} (Mínimo: {item.min_stock})
        </Alert>
      ))}
    </div>
  );
}
