export default function AiLayout({ children, aiApps, links }) {
  return (
    <section>
      {children}
      <div className="min-h-screen flex">
        <div className=" ">{aiApps}</div>
        <div className="">{links}</div>
      </div>
    </section>
  )
}
