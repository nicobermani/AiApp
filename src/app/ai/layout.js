export default function AiLayout({ children, aiApps, aiApp }) {
  return (
    <section>
      {children}
      <div className="min-h-screen flex">
        <div className=" ">{aiApps}</div>
        <div className="">{aiApp}</div>
      </div>
    </section>
  )
}
