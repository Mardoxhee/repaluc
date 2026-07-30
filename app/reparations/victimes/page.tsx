import VictimesModulePage from './VictimesModulePage';

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const first = (value: string | string[] | undefined): string | undefined => (
  Array.isArray(value) ? value[0] : value
);

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <VictimesModulePage
      initialFilters={{
        mention: first(params?.mention),
        agent: first(params?.agent),
        photo: first(params?.photo) === '1',
        signedContracts: first(params?.contrats) === 'signes',
      }}
    />
  );
}
