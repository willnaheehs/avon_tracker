import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
}

const password = process.env.DEMO_ACCOUNT_PASSWORD;
if (!password) {
  throw new Error("Missing DEMO_ACCOUNT_PASSWORD.");
}

const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);

const demo = {
  provider: {
    name: "Morgan Lee",
    email: `demo.provider.${stamp}@carepath.app`,
  },
  clients: [
    {
      name: "Alex Rivera",
      email: `demo.client.alex.${stamp}@carepath.app`,
      subject: "Hamstring recovery check-in",
      notes: [
        "Completed the strength block this morning. Tightness is down to a 3 out of 10, but sprint mechanics still feel guarded.",
        "Appreciate the update. Keep intensity at 70 percent for two more sessions and log any pulling sensation right after acceleration work.",
      ],
    },
    {
      name: "Jamie Chen",
      email: `demo.client.jamie.${stamp}@carepath.app`,
      subject: "Post-practice knee update",
      notes: [
        "Practice volume felt manageable today. Mild swelling after drills, but no instability and stairs feel better than last week.",
        "That is encouraging. Ice tonight, keep the brace for cutting work tomorrow, and let me know if swelling increases by the morning.",
      ],
    },
  ],
  organizationName: "CarePath Performance Lab",
};

function makeClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

async function signUpAndSignIn(email, userPassword) {
  const client = makeClient();

  const { error: signUpError } = await client.auth.signUp({
    email,
    password: userPassword,
  });
  if (signUpError) {
    throw new Error(`Sign up failed for ${email}: ${signUpError.message}`);
  }

  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password: userPassword,
  });
  if (signInError) {
    throw new Error(`Sign in failed for ${email}: ${signInError.message}`);
  }

  return client;
}

async function createProviderAndOrganization() {
  const providerClient = await signUpAndSignIn(demo.provider.email, password);

  const { error: registerError } = await providerClient.rpc("register_provider", {
    p_name: demo.provider.name,
  });
  if (registerError) {
    throw new Error(`Provider registration failed: ${registerError.message}`);
  }

  const { data: orgRows, error: orgError } = await providerClient.rpc("create_organization", {
    p_name: demo.organizationName,
  });
  if (orgError) {
    throw new Error(`Organization creation failed: ${orgError.message}`);
  }

  const organization = Array.isArray(orgRows) ? orgRows[0] : orgRows;
  if (!organization?.organization_id || !organization?.invite_code) {
    throw new Error("Organization creation returned no organization or invite code.");
  }

  return {
    providerClient,
    organizationId: organization.organization_id,
    inviteCode: organization.invite_code,
  };
}

async function createClientAccount(clientSeed, inviteCode) {
  const client = await signUpAndSignIn(clientSeed.email, password);

  const { data: registrationRows, error: registerError } = await client.rpc("register_client", {
    p_name: clientSeed.name,
    p_invite_code: inviteCode,
  });
  if (registerError) {
    throw new Error(`Client registration failed for ${clientSeed.email}: ${registerError.message}`);
  }

  const registration = Array.isArray(registrationRows) ? registrationRows[0] : registrationRows;
  if (!registration?.client_id || !registration?.thread_id) {
    throw new Error(`Client registration returned incomplete data for ${clientSeed.email}.`);
  }

  return {
    client,
    clientId: registration.client_id,
    threadId: registration.thread_id,
  };
}

async function addProviderNote(providerClient, clientId, organizationId, subject, body) {
  const { data: threadId, error: threadError } = await providerClient.rpc("create_note_thread", {
    p_client_user_id: clientId,
    p_organization_id: organizationId,
    p_subject: subject,
  });
  if (threadError) {
    throw new Error(`Provider thread creation failed: ${threadError.message}`);
  }

  const { error: noteError } = await providerClient.from("notes").insert({
    thread_id: threadId,
    body,
  });
  if (noteError) {
    throw new Error(`Provider note insert failed: ${noteError.message}`);
  }

  return threadId;
}

async function addClientReply(client, threadId, body) {
  const { error } = await client.from("notes").insert({
    thread_id: threadId,
    body,
  });
  if (error) {
    throw new Error(`Client note insert failed: ${error.message}`);
  }
}

async function main() {
  const { providerClient, organizationId, inviteCode } = await createProviderAndOrganization();
  const createdClients = [];

  for (const clientSeed of demo.clients) {
    const created = await createClientAccount(clientSeed, inviteCode);
    const threadId = await addProviderNote(
      providerClient,
      created.clientId,
      organizationId,
      clientSeed.subject,
      clientSeed.notes[1]
    );

    await addClientReply(created.client, threadId, clientSeed.notes[0]);

    createdClients.push({
      name: clientSeed.name,
      email: clientSeed.email,
      password,
      clientId: created.clientId,
      threadId,
      subject: clientSeed.subject,
    });
  }

  const output = {
    generatedAt: new Date().toISOString(),
    provider: {
      name: demo.provider.name,
      email: demo.provider.email,
      password,
    },
    organization: {
      name: demo.organizationName,
      organizationId,
      inviteCode,
    },
    clients: createdClients,
  };

  const outDir = resolve(process.cwd(), "demo");
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, `demo-accounts-${stamp}.json`);
  writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log(`Demo data created successfully.`);
  console.log(`Saved credentials to ${outPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
