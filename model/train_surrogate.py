# Melatih model ringkas (surrogate) untuk prototipe LifeScope.
# Dilatih HANYA pada train_final.csv resmi panitia, dengan 17 variabel yang
# dapat ditanyakan langsung kepada responden. Dipakai untuk demo di browser;
# pipeline penuh (176 fitur, 6 model) tetap ada di notebook kompetisi.
import json, numpy as np, pandas as pd, lightgbm as lgb
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import cohen_kappa_score

SEED = 42
BASE = r'C:\Users\mikae\OneDrive\Documents\Lomba\DataQuest'

FEATURES = [
    'general_health_status', 'depression_frequency', 'anxiety_frequency', 'age',
    'income_to_poverty_ratio', 'food_security_4cat', 'education_level',
    'worry_about_medical_costs', 'difficulty_social_activities', 'difficulty_remembering',
    'difficulty_walking_steps', 'difficulty_self_care', 'hospitalized_overnight',
    'skipped_prescription_due_to_cost', 'ever_married', 'sex', 'worked_last_week'
]

df = pd.read_csv(BASE + r'\train_final.csv')
X = df[FEATURES].astype(float).values
y = df['life_satisfaction'].astype(int).values
print('data', X.shape, 'kelas', np.bincount(y)[1:])

def expected_value(P):
    return (P * np.array([1., 2., 3., 4.])).sum(axis=1)

def apply_th(E, t):
    return 1 + (E > t[0]).astype(int) + (E > t[1]).astype(int) + (E > t[2]).astype(int)

def qwk(a, b):
    return cohen_kappa_score(a, b, weights='quadratic')

def optimise(E, yt):
    best, bt = -1, (1.5, 2.0, 2.4)
    for t1 in np.linspace(1.2, 1.9, 45):
        for t2 in np.linspace(1.8, 2.5, 32):
            if t2 <= t1: continue
            for t3 in np.linspace(2.1, 3.0, 26):
                if t3 <= t2: continue
                k = qwk(yt, apply_th(E, (t1, t2, t3)))
                if k > best: best, bt = k, (t1, t2, t3)
    # penghalusan lokal
    for _ in range(3):
        for i in range(3):
            for d in np.linspace(-0.06, 0.06, 25):
                c = list(bt); c[i] += d
                if not (c[0] < c[1] < c[2]): continue
                k = qwk(yt, apply_th(E, tuple(c)))
                if k > best: best, bt = k, tuple(c)
    return best, bt

PARAMS = dict(objective='multiclass', num_class=4, n_estimators=110, learning_rate=0.06,
              num_leaves=15, min_child_samples=120, subsample=0.85, subsample_freq=1,
              colsample_bytree=0.8, reg_lambda=8, n_jobs=-1, verbose=-1, random_state=SEED)

skf = StratifiedKFold(5, shuffle=True, random_state=SEED)
oof = np.zeros((len(y), 4))
for tr, va in skf.split(X, y):
    m = lgb.LGBMClassifier(**PARAMS); m.fit(X[tr], y[tr])
    oof[va] = m.predict_proba(X[va])

E = expected_value(oof)
k_th, th = optimise(E, y)
pred_th = apply_th(E, th)
pred_am = oof.argmax(axis=1) + 1
print('QWK argmax   : %.5f' % qwk(y, pred_am))
print('QWK + ambang : %.5f' % k_th)
print('akurasi      : %.5f' % (pred_th == y).mean())
print('ambang       :', [round(t, 4) for t in th])

final = lgb.LGBMClassifier(**PARAMS); final.fit(X, y)
dump = final.booster_.dump_model()

def pack(node):
    if 'leaf_value' in node:
        return {'v': round(float(node['leaf_value']), 6)}
    return {'f': int(node['split_feature']), 't': round(float(node['threshold']), 6),
            'm': 1 if node.get('default_left', True) else 0,
            'l': pack(node['left_child']), 'r': pack(node['right_child'])}

trees = [{'c': i % 4, 'n': pack(t['tree_structure'])} for i, t in enumerate(dump['tree_info'])]

stats = {}
for f in FEATURES:
    s = df[f].astype(float)
    stats[f] = {'min': float(s.min()), 'max': float(s.max()),
                'median': float(s.median()), 'mean': round(float(s.mean()), 4)}

out = {
    'meta': {
        'nama': 'LifeScope surrogate',
        'catatan': 'Model ringkas 17 variabel untuk demo browser. Pipeline penuh kompetisi memakai 176 fitur dan enam model dasar.',
        'seed': SEED, 'n_train': int(len(y)), 'n_fitur': len(FEATURES), 'n_pohon': len(trees),
        'qwk_oof_ambang': round(float(k_th), 5),
        'qwk_oof_argmax': round(float(qwk(y, pred_am)), 5),
        'akurasi_oof': round(float((pred_th == y).mean()), 5),
        'qwk_pipeline_penuh': 0.48425
    },
    'features': FEATURES,
    'stats': stats,
    'thresholds': [round(float(t), 6) for t in th],
    'trees': trees
}
with open('model_lifescope.json', 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
import os
print('model_lifescope.json  %.1f KB' % (os.path.getsize('model_lifescope.json') / 1024))

# distribusi E[y] out-of-fold untuk konteks populasi di UI
hist, edges = np.histogram(E, bins=60, range=(1.0, 3.2))
ctx = {'hist': hist.tolist(), 'edges': [round(float(e), 4) for e in edges],
       'dist_aktual': (np.bincount(y, minlength=5)[1:] / len(y)).round(5).tolist(),
       'dist_prediksi': (np.bincount(pred_th, minlength=5)[1:] / len(y)).round(5).tolist(),
       'dist_argmax': (np.bincount(pred_am, minlength=5)[1:] / len(y)).round(5).tolist()}
with open('konteks_lifescope.json', 'w', encoding='utf-8') as f:
    json.dump(ctx, f, ensure_ascii=False)
print('konteks ditulis')
