// Evaluated before the rest of the server bundle. @peculiar/x509 (via the
// passkey plugin) builds a tsyringe container at module load, which throws
// unless reflect-metadata is already active; bundling runs its own nested
// import too late.
import "reflect-metadata";
