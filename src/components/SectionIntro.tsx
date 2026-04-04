type SectionIntroProps = {
  number: string
  title: string
  description: string
}

export function SectionIntro({ number, title, description }: SectionIntroProps) {
  return (
    <div className="section-intro reveal">
      <p className="section-number">{number}</p>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  )
}
