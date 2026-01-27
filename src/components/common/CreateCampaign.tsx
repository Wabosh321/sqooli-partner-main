import { useEffect, useMemo, useState } from "react";
import { useActivityTracker } from "../../hooks/useActivityTracker";
import { supabase } from "../../lib/supabase";
import { listPrograms } from "../../lib/supabaseClient";
import { Button } from "../ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Alert, AlertDescription } from "../ui/alert";
import { X, Loader2 } from "lucide-react";

interface WizardState {
  program_id: string | "";
  channel_id: string | "";
  subchannel: string;
  name: string;
  description: string;
  target_signups: number;
}

export default function CreateCampaignWizard({
  partnerId,
  user_id,
  open,
  onClose,
}: {
  partnerId: string;
  user_id?: string;
  open: boolean;
  onClose?: () => void;
}) {
  const { track } = useActivityTracker(partnerId);
  const [programs, setPrograms] = useState<any[] | undefined>(undefined);
  const [channels, setChannels] = useState<any[] | undefined>(undefined);
  const [socialMediaAccounts, setSocialMediaAccounts] = useState<
    any[] | undefined
  >(undefined);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await listPrograms();

        // Fetch social media accounts for the partner (the actual channels)
        const { data: smData, error: smErr } = await supabase
          .from("social_media")
          .select(
            `
            id,
            platform,
            handle,
            url,
            follower_count,
            is_verified,
            status,
            channels (
              id,
              name,
              subchannels,
              metadata
            )
          `
          )
          .eq("partner_id", partnerId)
          .eq("status", "active");

        if (smErr) throw smErr;

        // Fallback: fetch channels if social_media not available
        const { data: chData, error: chErr } = await supabase
          .from("channels")
          .select("*")
          .eq("partner_id", partnerId)
          .eq("is_active", true);

        if (chErr) throw chErr;

        if (!mounted) return;

        // normalize programs to always expose `id` and `pricing` if present in metadata
        const normalizedPrograms = (p || []).map((prog: any) => ({
          id: prog.id ?? prog._id,
          name: prog.name,
          start_date: prog.start_date,
          end_date: prog.end_date,
          pricing: prog.pricing ?? prog.metadata?.pricing ?? null,
          ...prog,
        }));

        // Normalize social media accounts as channels
        const normalizedSocialMedia = (smData || []).map((sm: any) => ({
          id: sm.id,
          name: sm.platform,
          platform: sm.platform,
          handle: sm.handle,
          url: sm.url,
          follower_count: sm.follower_count,
          is_verified: sm.is_verified,
          subchannels: ["promotional", "engagement", "announcements"],
          type: "social_media",
          ...sm,
        }));

        // normalize channels to use `id` and `subchannels` keys (fallback)
        const normalizedChannels = (chData || []).map((c: any) => ({
          id: c.id ?? c._id,
          name: c.name,
          subchannels: c.subchannels ?? c.subchanells ?? [],
          ...c,
        }));

        setPrograms(normalizedPrograms);
        setSocialMediaAccounts(normalizedSocialMedia);
        setChannels(
          normalizedSocialMedia.length > 0
            ? normalizedSocialMedia
            : normalizedChannels
        );
      } catch (err: any) {
        if (
          err &&
          (err.code === "PGRST205" ||
            String(err.message || err).includes("Could not find the table"))
        ) {
          console.warn(
            "Optional table missing (social_media/channels/programs). Continuing with empty lists."
          );
        } else {
          console.error("Failed to load programs or channels", err);
        }
        if (!mounted) return;
        setPrograms([]);
        setChannels([]);
        setSocialMediaAccounts([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [partnerId]);

  const [step, setStep] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [state, setState] = useState<WizardState>({
    program_id: "",
    channel_id: "",
    subchannel: "",
    name: "",
    description: "",
    target_signups: 10000,
  });

  // Set initial program and channel when data loads
  useEffect(() => {
    if (programs && programs.length > 0 && !state.program_id) {
      setState((s) => ({ ...s, program_id: programs[0].id }));
    }
  }, [programs, state.program_id]);

  useEffect(() => {
    if (channels && channels.length > 0 && !state.channel_id) {
      setState((s) => ({ ...s, channel_id: channels[0].id }));
    }
  }, [channels, state.channel_id]);

  // Auto-calculations based on selected program
  const calculations = useMemo(() => {
    if (!state.program_id || !state.target_signups) return null;

    const selectedProgram = programs?.find(
      (p) => (p.id ?? p._id) === state.program_id
    );
    if (!selectedProgram) return null;

    const start = new Date(selectedProgram.start_date);
    const end = new Date(selectedProgram.end_date);
    const days = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    const dailyTarget = Math.ceil(state.target_signups / days);
    const pricePerLesson = selectedProgram.pricing;
    const bundlePrice = pricePerLesson * 5;
    const revenueProjection = state.target_signups * bundlePrice;
    const partnerShare = revenueProjection * 0.2;

    return {
      days,
      dailyTarget,
      pricePerLesson,
      bundlePrice,
      revenueProjection,
      partnerShare,
      duration_start: selectedProgram.start_date,
      duration_end: selectedProgram.end_date,
    };
  }, [state.program_id, state.target_signups, programs]);

  const resetWizard = () => {
    setState({
      program_id: programs?.[0]?.id ?? programs?.[0]?._id ?? "",
      channel_id: channels?.[0]?.id ?? channels?.[0]?._id ?? "",
      subchannel: "",
      name: "",
      description: "",
      target_signups: 10000,
    });
    setStep(0);
    setError(null);
    setSuccess(null);
  };

  const canNext = () => {
    if (step === 0) {
      return Boolean(
        state.name && state.program_id && state.channel_id && state.description
      );
    }
    return true;
  };

  const next = () => {
    if (!canNext()) return;
    setError(null);
    setStep((s) => Math.min(s + 1, 1));
  };

  const prev = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleCreate = async () => {
    setError(null);
    setIsSaving(true);
    try {
      if (!state.program_id || !state.channel_id) {
        setError("Please select a program and channel");
        setIsSaving(false);
        return;
      }

      if (!calculations) {
        setError("Unable to calculate campaign details");
        setIsSaving(false);
        return;
      }

      // Call backend API which invokes the secure `create_campaign` RPC
      const resp = await fetch("/api/create-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId,
          userId: user_id || null,
          programId: state.program_id,
          channelId: state.channel_id,
          subchannel: state.subchannel || null,
          name: state.name,
          description: state.description,
          targetSignups: state.target_signups,
          durationStart: calculations.duration_start,
          durationEnd: calculations.duration_end,
        }),
      });
      const result = await resp.json();
      if (!resp.ok)
        throw new Error(result?.error || "Campaign creation failed");
      const insertedId = result?.campaign?.id;

      track({
        type: "campaign_created",
        payload: { campaignId: String(insertedId), name: state.name },
      });

      setSuccess("Campaign created successfully!");

      setTimeout(() => {
        setSuccess(null);
        onClose?.();
        resetWizard();
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  const selectedProgram = programs?.find((p) => p._id === state.program_id);
  const selectedChannel = channels?.find(
    (c) => (c.id ?? c._id) === state.channel_id
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <Card className="w-full max-w-xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b border-border px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-card-foreground">
              Create Campaign Link
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                resetWizard();
                onClose?.();
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Step 0: Campaign Details */}
          {step === 0 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="campaign-name"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Campaign Name
                </Label>
                <Input
                  id="campaign-name"
                  value={state.name}
                  onChange={(e) =>
                    setState((s) => ({ ...s, name: e.target.value }))
                  }
                  placeholder="Enter campaign name"
                  className="h-10 sm:h-11"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="program"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Program
                </Label>
                <select
                  id="program"
                  value={state.program_id}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      program_id: e.target.value as string,
                    }))
                  }
                  className="w-full h-10 sm:h-11 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">Select...</option>
                  {programs?.map((p) => (
                    <option key={p.id ?? p._id} value={p.id ?? p._id}>
                      {p.name} ({p.start_date} → {p.end_date})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="channel"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Social Media Channel
                  </Label>
                  <select
                    id="channel"
                    value={state.channel_id}
                    onChange={(e) => {
                      const newChannelId = e.target.value as string;
                      setState((s) => ({
                        ...s,
                        channel_id: newChannelId,
                        subchannel: "", // Reset subchannel when channel changes
                      }));
                    }}
                    className="w-full h-10 sm:h-11 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="">Select Social Media Channel...</option>
                    {channels?.map((c) => (
                      <option key={c.id ?? c._id} value={c.id ?? c._id}>
                        {c.platform
                          ? `${c.platform.toUpperCase()} - ${c.handle}`
                          : c.name}
                        {c.follower_count > 0 &&
                          ` (${c.follower_count.toLocaleString()} followers)`}
                        {c.is_verified && " ✓"}
                      </option>
                    ))}
                  </select>
                  {socialMediaAccounts && socialMediaAccounts.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      No social media accounts connected. Admin can add them
                      from settings.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="subchannel"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Sub-channel (optional)
                  </Label>
                  <select
                    id="subchannel"
                    value={state.subchannel}
                    onChange={(e) =>
                      setState((s) => ({ ...s, subchannel: e.target.value }))
                    }
                    className="w-full h-10 sm:h-11 px-3 rounded-md border border-input bg-background"
                    disabled={
                      !state.channel_id || !selectedChannel?.subchannels?.length
                    }
                  >
                    <option value="">Select...</option>
                    {selectedChannel?.subchannels?.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub.charAt(0).toUpperCase() + sub.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-sm font-medium text-muted-foreground"
                >
                  About Campaign
                </Label>
                <Textarea
                  id="description"
                  value={state.description}
                  onChange={(e) =>
                    setState((s) => ({ ...s, description: e.target.value }))
                  }
                  placeholder="Enter a description..."
                  className="min-h-[120px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="target"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Target Signups
                </Label>
                <Input
                  id="target"
                  type="number"
                  min={1}
                  value={state.target_signups}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      target_signups: Number(e.target.value),
                    }))
                  }
                  className="h-10 sm:h-11"
                />
              </div>

              {calculations && (
                <Alert className="bg-accent/10 border-accent/20">
                  <AlertDescription>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Campaign Duration:
                        </span>
                        <strong>{calculations.days} days</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Daily Target:
                        </span>
                        <strong>{calculations.dailyTarget} signups/day</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Bundle Price:
                        </span>
                        <strong>
                          KES {calculations.bundlePrice.toLocaleString()}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Revenue Projection:
                        </span>
                        <strong>
                          KES {calculations.revenueProjection.toLocaleString()}
                        </strong>
                      </div>
                      <div className="flex justify-between text-primary">
                        <span>Your Share (20%):</span>
                        <strong>
                          KES {calculations.partnerShare.toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Step 1: Review */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">
                Review Campaign Details
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Campaign Name:</span>
                  <span className="font-semibold">{state.name}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Program:</span>
                  <span className="font-semibold">{selectedProgram?.name}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Channel:</span>
                  <span className="font-semibold">
                    {selectedChannel?.platform ? (
                      <>
                        {selectedChannel.platform.toUpperCase()}
                        {selectedChannel.handle &&
                          ` - ${selectedChannel.handle}`}
                        {selectedChannel.follower_count > 0 &&
                          ` (${selectedChannel.follower_count.toLocaleString()} followers)`}
                        {selectedChannel.is_verified && " ✓"}
                      </>
                    ) : (
                      selectedChannel?.name
                    )}
                    {state.subchannel && ` > ${state.subchannel}`}
                  </span>
                </div>

                {calculations && (
                  <>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-semibold">
                        {calculations.duration_start} →{" "}
                        {calculations.duration_end}
                      </span>
                    </div>

                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">
                        Target Signups:
                      </span>
                      <span className="font-semibold">
                        {state.target_signups.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">
                        Daily Target:
                      </span>
                      <span className="font-semibold">
                        {calculations.dailyTarget} signups/day
                      </span>
                    </div>

                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">
                        Price per Lesson:
                      </span>
                      <span className="font-semibold">
                        KES {calculations.pricePerLesson}
                      </span>
                    </div>

                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">
                        Bundle (5 lessons):
                      </span>
                      <span className="font-semibold">
                        KES {calculations.bundlePrice}
                      </span>
                    </div>

                    <div className="flex justify-between py-2 border-b border-border bg-muted px-3 rounded">
                      <span className="font-medium">
                        Your Expected Earnings:
                      </span>
                      <span className="font-bold text-primary">
                        KES {calculations.partnerShare.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}

                <div className="py-2">
                  <span className="text-muted-foreground">Description:</span>
                  <p className="mt-1 text-sm">{state.description}</p>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-500 bg-green-50">
                  <AlertDescription className="text-green-700">
                    {success}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-muted flex justify-between border-t border-border px-4 sm:px-6 py-3 sm:py-4">
          {step > 0 && (
            <Button variant="outline" onClick={prev} className="h-9 sm:h-10">
              Back
            </Button>
          )}

          {step === 0 && (
            <div className="w-full flex justify-end">
              <Button
                onClick={next}
                disabled={!canNext()}
                className="h-9 sm:h-10"
              >
                Continue
              </Button>
            </div>
          )}

          {step === 1 && (
            <Button
              onClick={handleCreate}
              disabled={isSaving}
              className="ml-auto h-9 sm:h-10"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Campaign"
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
