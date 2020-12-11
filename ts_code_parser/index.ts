import {createProgramFromTsConfig} from './tsconfig_parser';
import {createSourceFileFilter} from './source_file_filter';
import {
  getPolymerElementJsons,
  PolymerElementInfoJSON,
} from './polymer_element_json';

async function main() {
  const program = createProgramFromTsConfig(
    '/Users/dmfilippov/gerrit/gerrit/polygerrit-ui/app/tsconfig.json'
  );
  const programFiles = program.getSourceFiles().filter(
    createSourceFileFilter({
      include: ['*.ts'],
      exclude: ['*.d.ts', '*_tets.ts'],
    })
  );
  const typeChecker = program.getTypeChecker();

  const jsonElements: PolymerElementInfoJSON[] = getPolymerElementJsons(
    typeChecker,
    programFiles
  );
  console.log(jsonElements);
}

main().catch(error => {
  console.error(error.message);
  console.error(error.stack);
  throw error;
});
