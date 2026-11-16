export default function Loading() {
  return (
    <div aria-busy="true" style={{ display: "grid", gap: 14 }}>
      <div className="sk" style={{ height: 38, width: "40%" }} />
      <div className="sk" style={{ height: 16, width: "62%" }} />
      <div style={{ display: "grid", gap: 10, marginTop: 18 }}>{[0, 1, 2, 3, 4].map((i) => <div key={i} className="sk" style={{ height: 52 }} />)}</div>
    </div>
  );
}
