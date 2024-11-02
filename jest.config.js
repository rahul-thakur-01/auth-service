/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
    testEnvironment: 'node',
    // transform: {
    //   "^.+.tsx?$": ["ts-jest",{}],
    // },
    preset: 'ts-jest',
    verbose: true,

    collectionCoverage: true,
    coverageProvider: 'v8',
    collectionCoverageFrom: [
        'src/**/*.ts',
        "!tests/**",
        "!**/node_modules/**",
    ],
}
