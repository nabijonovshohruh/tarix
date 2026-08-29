import { Link, useLocation, useNavigate } from "react-router-dom";
import { Header } from "../../components/layout/Header";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { uz } from "../../i18n/uz";

interface LocationState {
  testTitle?: string;
}

// Shown right after a student submits — the submit endpoint deliberately
// returns no score at all (see api/certificates.ts's submitCertificateTest),
// since results stay hidden until the admin calibrates and releases the
// whole test. Actual scores, once released, live on CertificateMyResultsScreen.
export function CertificateResultScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { testTitle } = (location.state as LocationState) ?? {};

  return (
    <div>
      <Header title={uz.certificateTest.submittedTitle} showBack />
      <div className="space-y-4 p-4">
        <Card className="space-y-3 text-center">
          <p className="text-4xl">✅</p>
          {testTitle && <p className="text-sm text-slate-500 dark:text-slate-400">{testTitle}</p>}
          <p className="text-base font-semibold">{uz.certificateTest.submittedMessage}</p>
        </Card>

        <Link to="/certificate-test/results">
          <Button className="w-full">{uz.certificateTest.myResults}</Button>
        </Link>

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => navigate("/certificate-test")}>
            {uz.certificateTest.backToCode}
          </Button>
          <Link to="/" className="flex-1">
            <Button variant="secondary" className="w-full">
              {uz.nav.home}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
