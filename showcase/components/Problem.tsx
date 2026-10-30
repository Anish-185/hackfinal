import { Reveal, Item } from "./Reveal";

export default function Problem() {
  return (
    <section className="section" id="problem">
      <div className="wrap">
        <p className="label">The problem</p>
        <Reveal className="grid problem-grid">
          <Item as="h2" className="problem-claim problem-a">
            A LeetCode medium says nothing about whether someone can find a bug in a FastAPI service.
          </Item>
          <Item as="h2" className="problem-claim problem-b">
            And a take-home in 2026 measures the candidate&apos;s AI tools about as much as the candidate.
          </Item>
          <Item className="problem-body">
            <p>
              Generic tests ignore what the candidate says they&apos;ve built. Take-homes say more, but you can&apos;t
              tell who, or what, wrote the code.
            </p>
            <p>
              We wanted a test about the candidate&apos;s own claimed work, in their own stack, that an AI can&apos;t
              finish on its own, and whose score depends on nobody&apos;s judgement. Not a reviewer&apos;s, and not a
              model&apos;s.
            </p>
          </Item>
        </Reveal>
      </div>
    </section>
  );
}
