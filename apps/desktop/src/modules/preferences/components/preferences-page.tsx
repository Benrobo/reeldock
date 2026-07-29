import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft01Icon } from "@benrobo/iconary/core/duotone-rounded";
import {
  ActivitySpinner,
  Button,
  GroupLabel,
  SettingsList,
  SettingsRow,
  Switch,
  Tabs,
  ValueChip,
} from "@reeldock/ui";
import { ColorIcon } from "@/components/color-icon";
import { PREFERENCE_TABS } from "@/config/preferences";
import { preferencesService, type AppPreferences } from "@/services";

export function PreferencesPage() {
  const [preferences, setPreferences] = useState<AppPreferences | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    preferencesService
      .get()
      .then((value) => {
        if (!cancelled) {
          setPreferences(value);
          setStorageError(null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStorageError("Open ReelDock in the desktop app to edit local preferences.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const save = async (patch: Partial<AppPreferences>) => {
    try {
      setPreferences(await preferencesService.save(patch));
      setStorageError(null);
    } catch {
      setStorageError("Could not save preferences to local SQLite.");
    }
  };

  return (
    <main className="bg-window flex h-full flex-col">
      <header className="border-titlebar-line bg-titlebar flex h-[60px] items-center justify-center gap-4 border-b px-6">
        <Link className="absolute left-6" to="/">
          <Button leading={<ColorIcon icon={ArrowLeft01Icon} size={15} tone="back" />} size="mini">
            Back
          </Button>
        </Link>
        <Tabs options={[...PREFERENCE_TABS]} value="General" />
      </header>

      <div className="flex flex-1 justify-center overflow-y-auto px-10 py-11">
        <div className="flex w-[620px] flex-col gap-6">
          {loading ? (
            <div className="flex flex-col gap-2">
              <div className="text-fg-3 flex items-center gap-2 text-sm">
                <ActivitySpinner size={16} />
                Loading preferences
              </div>
              {storageError ? <div className="text-warn-fg text-sm">{storageError}</div> : null}
            </div>
          ) : !preferences ? (
            <div className="text-warn-fg text-sm">{storageError}</div>
          ) : (
            <>
              <section>
                <GroupLabel className="mb-2.5">General</GroupLabel>
                <SettingsList>
                  <SettingsRow label="Default project name">
                    <ValueChip>{preferences.defaultProjectName}</ValueChip>
                  </SettingsRow>
                  <SettingsRow label="Open editor after recording">
                    <Switch
                      checked={preferences.openEditorAfterRecording}
                      label="Open editor"
                      onChange={(openEditorAfterRecording) =>
                        void save({ openEditorAfterRecording })
                      }
                    />
                  </SettingsRow>
                  <SettingsRow label="Save recordings to">
                    <ValueChip>{preferences.recordingsPath}</ValueChip>
                  </SettingsRow>
                </SettingsList>
              </section>

              <section>
                <GroupLabel className="mb-2.5">Recording</GroupLabel>
                <SettingsList>
                  <SettingsRow hint="Higher quality uses more disk." label="Quality">
                    <ValueChip>{preferences.recordingQuality}</ValueChip>
                  </SettingsRow>
                  <SettingsRow hint="Android stays out of MVP scope." label="Phone capture">
                    <ValueChip>{preferences.phoneCapture}</ValueChip>
                  </SettingsRow>
                  <SettingsRow
                    hint="Uses VideoToolbox where available."
                    label="Hardware acceleration"
                  >
                    <Switch
                      checked={preferences.hardwareAcceleration}
                      label="Acceleration"
                      onChange={(hardwareAcceleration) => void save({ hardwareAcceleration })}
                    />
                  </SettingsRow>
                </SettingsList>
              </section>
            </>
          )}
          {preferences && storageError ? (
            <div className="text-warn-fg text-sm">{storageError}</div>
          ) : null}

          <p className="text-fg-3 text-xs leading-[1.6]">
            Recordings stay on this Mac. ReelDock never uploads a file unless you ask it to.
          </p>
        </div>
      </div>
    </main>
  );
}
